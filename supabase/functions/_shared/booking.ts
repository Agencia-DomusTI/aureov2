import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ensureCalendarEventForBooking, fetchCalendarEvents, isGoogleConnected } from './google.ts';
import { createBookingGhlAppointment } from './ghl.ts';
import { sendPaidBookingEmails } from './email.ts';
import {
  classifyService,
  isSiteCreatedGoogleEvent,
  parseServiceFromTitle,
  toOccupancyItem,
  type OccupancyItem,
  type TimePeriod,
} from './capacity.ts';

export const DEFAULT_DEPOSIT_MXN = 250;

/** Minutos que una reserva pendiente (sin pagar) mantiene el horario apartado. */
export const PENDING_HOLD_MINUTES = 30;

type ServiceConfig = { depositMxn?: number | string | null; priceLabel?: string; active?: boolean };

/** Por defecto activo; solo oculta si `active === false` en admin */
export function isServiceActive(
  serviceId: string,
  servicesConfig?: Record<string, ServiceConfig>,
): boolean {
  return servicesConfig?.[serviceId]?.active !== false;
}

function parseDepositValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return null;
  return Math.max(0, n);
}

export function getBaseDeposit(settings: { depositAmountMxn?: number | null }) {
  const parsed = parseDepositValue(settings.depositAmountMxn);
  return parsed ?? DEFAULT_DEPOSIT_MXN;
}

export function getServiceDeposit(
  settings: {
    depositAmountMxn?: number | null;
    servicesConfig?: Record<string, ServiceConfig>;
  },
  serviceName: string,
): number {
  const override = parseDepositValue(settings.servicesConfig?.[serviceName]?.depositMxn);
  if (override !== null) return override;
  return getBaseDeposit(settings);
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateConfirmationCode(): string {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `AUREO-${suffix}`;
}

export async function createUniqueConfirmationCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateConfirmationCode();
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('confirmation_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  return `AUREO-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

type BookingRow = {
  id?: string;
  event_id?: string | null;
  service?: string | null;
  start_at?: string;
  end_at?: string;
  payment_status?: string | null;
  deposit_paid?: boolean | null;
  created_at?: string | null;
};

function isActiveBooking(b: BookingRow, holdCutoff: string) {
  const paid = Boolean(b.deposit_paid) ||
    b.payment_status === 'paid' ||
    b.payment_status === 'waived';
  if (paid) return true;
  return b.payment_status === 'pending' &&
    typeof b.created_at === 'string' && b.created_at >= holdCutoff;
}

/**
 * Horarios ocupados según la tabla `bookings`: todas las citas pagadas/confirmadas
 * y las pendientes recientes (dentro de la ventana de apartado). Complementa el
 * freeBusy de Google, que ya no recibe el evento hasta que se confirma el pago.
 */
export async function fetchBookingBusyPeriods(
  supabase: SupabaseClient,
  dateStr: string,
): Promise<{ start: string; end: string }[]> {
  const occupancy = await fetchBookingOccupancy(supabase, dateStr);
  return occupancy.map((b) => ({ start: String(b.start), end: String(b.end) }));
}

export async function fetchBookingOccupancy(
  supabase: SupabaseClient,
  dateStr: string,
): Promise<OccupancyItem[]> {
  const dayStart = `${dateStr}T00:00:00-06:00`;
  const dayEnd = `${dateStr}T23:59:59-06:00`;
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('bookings')
    .select('id, event_id, service, start_at, end_at, payment_status, deposit_paid, created_at')
    .gte('start_at', dayStart)
    .lte('start_at', dayEnd);

  if (!data) return [];

  return (data as BookingRow[])
    .filter((b) => isActiveBooking(b, holdCutoff) && b.start_at && b.end_at)
    .map((b) => toOccupancyItem(String(b.service ?? ''), b.start_at as string, b.end_at as string));
}

function isDuplicateGoogleEvent(
  event: { id?: string; title?: string; start?: string; description?: string },
  bookings: OccupancyItem[],
  linkedEventIds: Set<string>,
) {
  if (event.id && linkedEventIds.has(event.id)) return true;
  if (isSiteCreatedGoogleEvent(event.description)) return true;
  if (!event.start) return false;

  const eventStart = new Date(event.start).getTime();
  const eventService = parseServiceFromTitle(event.title || '');
  return bookings.some((b) => {
    if (Math.abs(eventStart - toMs(b.start)) > 2 * 60 * 1000) return false;
    const bookingService = String(b.service ?? '');
    return !eventService || !bookingService ||
      eventService.toLowerCase() === bookingService.toLowerCase();
  });
}

function toMs(value: string | number) {
  return typeof value === 'number' ? value : new Date(value).getTime();
}

function isClinicAppointmentEvent(title: string) {
  const serviceName = parseServiceFromTitle(title);
  const resource = classifyService(serviceName);
  if (resource.machine || resource.pool === 'infusion') return true;
  // Citas a mano con el formato del sitio: "Servicio — Paciente".
  return /\s[-–—]\s/.test(String(title || ''));
}

/**
 * Ocupación del día: reservas del sitio + citas manuales de Google (con servicio),
 * y bloqueos duros (eventos de Google que no son un tratamiento).
 */
export async function fetchDayCapacity(
  supabase: SupabaseClient,
  dateStr: string,
): Promise<{ occupancy: OccupancyItem[]; hardBlocks: TimePeriod[]; googleConnected: boolean }> {
  const dayStart = `${dateStr}T00:00:00-06:00`;
  const dayEnd = `${dateStr}T23:59:59-06:00`;
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('bookings')
    .select('id, event_id, service, start_at, end_at, payment_status, deposit_paid, created_at')
    .gte('start_at', dayStart)
    .lte('start_at', dayEnd);

  const rows = (data ?? []) as BookingRow[];
  const active = rows.filter((b) => isActiveBooking(b, holdCutoff) && b.start_at && b.end_at);
  const occupancy: OccupancyItem[] = active.map((b) =>
    toOccupancyItem(String(b.service ?? ''), b.start_at as string, b.end_at as string),
  );
  const linkedEventIds = new Set(
    rows.map((b) => b.event_id).filter((id): id is string => Boolean(id)),
  );

  let googleConnected = false;
  const hardBlocks: TimePeriod[] = [];

  if (await isGoogleConnected(supabase)) {
    googleConnected = true;
    const events = await fetchCalendarEvents(supabase, dayStart, dayEnd);

    for (const event of events) {
      if (!event.start || !event.end) continue;
      if (isDuplicateGoogleEvent(event, occupancy, linkedEventIds)) continue;

      // Evento de día completo → el doctor no está.
      const allDay = /^\d{4}-\d{2}-\d{2}$/.test(event.start);
      if (allDay || !isClinicAppointmentEvent(event.title)) {
        hardBlocks.push({ start: event.start, end: event.end });
        continue;
      }

      occupancy.push(toOccupancyItem(parseServiceFromTitle(event.title), event.start, event.end));
    }
  }

  return { occupancy, hardBlocks, googleConnected };
}

/**
 * Acciones al confirmarse el pago (o al confirmarse una cita sin anticipo):
 * crea el evento en Google Calendar y la cita en GHL si aún no existen, y envía
 * los correos. Idempotente y tolerante a fallos — un error en calendario, GHL o
 * correo no debe tumbar la confirmación del pago.
 */
export async function finalizePaidBooking(
  supabase: SupabaseClient,
  booking: Record<string, unknown>,
  opts?: { patientEmail?: string | null; sendEmails?: boolean },
) {
  try {
    await ensureCalendarEventForBooking(supabase, booking);
  } catch (err) {
    console.error('finalizePaidBooking: error creando evento de calendario:', (err as Error).message);
  }

  if (booking.ghl_contact_id && !booking.ghl_appointment_id) {
    try {
      const appointmentId = await createBookingGhlAppointment({
        contactId: booking.ghl_contact_id as string,
        service: booking.service as string,
        start: booking.start_at as string,
        end: booking.end_at as string,
        patient: {
          name: booking.patient_name as string,
          phone: booking.patient_phone as string,
          email: (booking.patient_email as string | null) ?? undefined,
          notes: (booking.patient_notes as string | null) ?? undefined,
        },
        confirmationCode: (booking.confirmation_code as string | null) ?? undefined,
        depositAmountMxn: (booking.deposit_amount_mxn as number | null) ?? undefined,
      });
      if (appointmentId) {
        await supabase.from('bookings').update({ ghl_appointment_id: appointmentId }).eq('id', booking.id);
      }
    } catch (err) {
      console.error('finalizePaidBooking: error creando cita en GHL:', (err as Error).message);
    }
  }

  if (opts?.sendEmails !== false) {
    try {
      await sendPaidBookingEmails(booking, { patientEmail: opts?.patientEmail });
    } catch (err) {
      console.error('finalizePaidBooking: error enviando correos:', (err as Error).message);
    }
  }
}

export function buildDepositsMap(
  servicesConfig: Record<string, ServiceConfig> | undefined,
  baseDeposit: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!servicesConfig) return map;
  for (const [id, cfg] of Object.entries(servicesConfig)) {
    if (cfg.depositMxn !== undefined && cfg.depositMxn !== null) {
      map[id] = Math.max(0, Math.round(cfg.depositMxn));
    }
  }
  return map;
}
