import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ensureCalendarEventForBooking } from './google.ts';
import { createBookingGhlAppointment } from './ghl.ts';
import { sendPaidBookingEmails } from './email.ts';

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

/**
 * Horarios ocupados según la tabla `bookings`: todas las citas pagadas/confirmadas
 * y las pendientes recientes (dentro de la ventana de apartado). Complementa el
 * freeBusy de Google, que ya no recibe el evento hasta que se confirma el pago.
 */
export async function fetchBookingBusyPeriods(
  supabase: SupabaseClient,
  dateStr: string,
): Promise<{ start: string; end: string }[]> {
  const dayStart = `${dateStr}T00:00:00-06:00`;
  const dayEnd = `${dateStr}T23:59:59-06:00`;
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('bookings')
    .select('start_at, end_at, payment_status, deposit_paid, created_at')
    .gte('start_at', dayStart)
    .lte('start_at', dayEnd);

  if (!data) return [];

  return data
    .filter((b) => {
      const paid = Boolean(b.deposit_paid) ||
        b.payment_status === 'paid' ||
        b.payment_status === 'waived';
      if (paid) return true;
      // Pendiente de pago: aparta el horario solo durante la ventana de pago.
      return b.payment_status === 'pending' &&
        typeof b.created_at === 'string' && b.created_at >= holdCutoff;
    })
    .map((b) => ({ start: b.start_at as string, end: b.end_at as string }));
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
