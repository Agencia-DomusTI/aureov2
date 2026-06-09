import { createServiceClient, getClinicSettings, handleCors, json, verifyAdmin } from '../_shared/utils.ts';
import { fetchCalendarEvents, getCalendarStatus } from '../_shared/google.ts';
import { isStripeConfigured } from '../_shared/stripe.ts';
import {
  addMxDays,
  addMxMonths,
  daysBetweenInclusive,
  endOfMonthMx,
  formatMxLabel,
  formatMxMonthYear,
  formatMxRangeLabel,
  mxDateKey,
  mxDayEndIso,
  mxDayNum,
  mxDayStartIso,
  mxKeyToDate,
  startOfMonthMx,
  startOfWeekMx,
} from '../_shared/mxTime.ts';

function mapBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    eventId: b.event_id,
    service: b.service,
    durationMinutes: b.duration_minutes,
    start: b.start_at,
    end: b.end_at,
    patient: {
      name: b.patient_name,
      phone: b.patient_phone,
      email: b.patient_email,
      notes: b.patient_notes,
    },
    createdAt: b.created_at,
    confirmationCode: b.confirmation_code,
    depositAmountMxn: b.deposit_amount_mxn,
    depositPaid: b.deposit_paid,
    paymentStatus: b.payment_status,
    source: 'site' as const,
  };
}

function parseEventTitle(title: string) {
  const parts = title.split(/\s[-–—]\s/);
  if (parts.length >= 2) {
    return {
      service: parts[0].trim(),
      patient: parts.slice(1).join(' — ').trim(),
    };
  }
  return { service: title.trim(), patient: '' };
}

function serviceFromTitle(title: string) {
  return parseEventTitle(title).service;
}

/** Eventos que el propio sitio creó en Google (espejo de una reserva del sitio). */
function isSiteCreatedGoogleEvent(e: { description?: string }) {
  const d = (e.description ?? '').toLowerCase();
  return d.includes('aureoclinique.com') || d.includes('reservado desde');
}

function isGoogleEventDuplicate(
  e: { id: string; title?: string; start?: string; description?: string },
  siteBookings: ReturnType<typeof mapBooking>[],
  linkedEventIds: Set<string>,
) {
  if (linkedEventIds.has(e.id)) return true;
  // Espejo creado por create-booking → nunca mostrar aparte en el panel.
  if (isSiteCreatedGoogleEvent(e)) return true;

  if (!e.start) return false;
  const eventStart = new Date(e.start).getTime();
  const titleLower = (e.title ?? '').toLowerCase();

  for (const b of siteBookings) {
    const bookingStart = new Date(b.start as string).getTime();
    if (Math.abs(eventStart - bookingStart) <= 5 * 60 * 1000) return true;

    const patient = String(b.patient.name ?? '').toLowerCase().trim();
    const service = String(b.service ?? '').toLowerCase().trim();
    if (patient && titleLower.includes(patient)) return true;
    if (service && titleLower.includes(service)) return true;
  }

  return false;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  const url = new URL(req.url);
  const monthOffset = parseInt(url.searchParams.get('monthOffset') ?? '0', 10) || 0;

  const supabase = createServiceClient();
  const now = new Date();
  const todayKey = mxDateKey(now);

  const monthStart = addMxMonths(startOfMonthMx(todayKey), monthOffset);
  const monthEnd = endOfMonthMx(monthStart);
  const rangeStartKey = startOfWeekMx(mxKeyToDate(monthStart));
  const rangeEndKey = addMxDays(startOfWeekMx(mxKeyToDate(monthEnd)), 6);
  const totalDays = daysBetweenInclusive(rangeStartKey, rangeEndKey);

  const rangeStartIso = mxDayStartIso(rangeStartKey);
  const rangeEndIso = mxDayEndIso(addMxDays(rangeStartKey, totalDays));

  const rangeLabel = formatMxMonthYear(monthStart);

  const [calendar, schedule, bookingsRes, rangeBookingsRes, allBookingsRes] = await Promise.all([
    getCalendarStatus(supabase),
    getClinicSettings(supabase),
    supabase.from('bookings').select('*').order('start_at', { ascending: false }).limit(80),
    supabase.from('bookings').select('*')
      .gte('start_at', rangeStartIso)
      .lt('start_at', rangeEndIso)
      .order('start_at', { ascending: true }),
    supabase.from('bookings').select('service'),
  ]);

  // En el panel admin se muestran TODAS las reservas del sitio (incluso con
  // anticipo pendiente) para que siempre se vea teléfono, email y código.
  // El evento duplicado de Google se oculta vía isGoogleDuplicate.
  const bookings = (bookingsRes.data ?? []).map(mapBooking);
  const rangeBookings = (rangeBookingsRes.data ?? []).map(mapBooking);

  let googleEvents: Array<{
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    source: string;
  }> = [];
  if (calendar.connected) {
    googleEvents = await fetchCalendarEvents(supabase, rangeStartIso, rangeEndIso);
  }

  const allRangeRows = rangeBookingsRes.data ?? [];
  const linkedEventIds = new Set(
    allRangeRows.map((b) => b.event_id as string | null).filter(Boolean),
  );

  const isGoogleDuplicate = (e: { id: string; title?: string; start?: string; description?: string }) =>
    isGoogleEventDuplicate(e, rangeBookings, linkedEventIds);

  const unlinkedGoogle = googleEvents.filter((e) => !isGoogleDuplicate(e));

  const todayBookings = rangeBookings.filter((b) => mxDateKey(new Date(b.start as string)) === todayKey);
  const todayGoogle = unlinkedGoogle.filter((e) => e.start && mxDateKey(new Date(e.start)) === todayKey);

  const serviceCounts: Record<string, number> = {};
  (allBookingsRes.data ?? []).forEach((b) => {
    const s = b.service as string;
    serviceCounts[s] = (serviceCounts[s] ?? 0) + 1;
  });

  unlinkedGoogle.forEach((e) => {
    const s = serviceFromTitle(e.title);
    if (s) serviceCounts[s] = (serviceCounts[s] ?? 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const weekDays = Array.from({ length: totalDays }, (_, i) => {
    const key = addMxDays(rangeStartKey, i);
    const d = mxKeyToDate(key);
    const inMonth = key >= monthStart && key <= monthEnd;
    const dayBookings = rangeBookings.filter((b) => mxDateKey(new Date(b.start as string)) === key);
    const dayGoogleRaw = googleEvents.filter((e) => e.start && mxDateKey(new Date(e.start)) === key);
    // Usa el set global (incluye reservas pendientes) para no mostrar su evento
    // de Google como evento suelto cuando la reserva se oculta.
    const dayGoogle = dayGoogleRaw.filter((e) => !isGoogleDuplicate(e));
    const weekIndex = Math.floor(i / 7);
    return {
      date: key,
      dayNum: mxDayNum(d),
      monthLabel: formatMxMonthYear(monthStart),
      label: formatMxLabel(key, 'long'),
      shortLabel: formatMxLabel(key, 'short'),
      isToday: key === todayKey,
      inMonth,
      weekIndex,
      count: dayBookings.length + dayGoogle.length,
      appointments: [
        ...dayBookings.map((b) => ({
          id: b.id,
          eventId: b.eventId,
          title: b.service,
          subtitle: b.patient.name,
          detail: b.patient.phone,
          phone: b.patient.phone,
          patientName: b.patient.name,
          patientPhone: b.patient.phone,
          patientEmail: b.patient.email ?? '',
          patientNotes: b.patient.notes ?? '',
          durationMinutes: b.durationMinutes,
          createdAt: b.createdAt,
          confirmationCode: b.confirmationCode,
          depositAmountMxn: b.depositAmountMxn,
          depositPaid: b.depositPaid,
          paymentStatus: b.paymentStatus,
          start: b.start,
          end: b.end,
          source: 'site',
          sourceLabel: 'Reserva del sitio',
          canDelete: true,
        })),
        ...dayGoogle.map((e) => {
          const parsed = parseEventTitle(e.title);
          return {
            id: e.id,
            eventId: e.id,
            title: parsed.service,
            subtitle: parsed.patient || 'Sin paciente',
            detail: 'Google Calendar',
            phone: '',
            patientName: parsed.patient || '',
            patientPhone: '',
            patientEmail: '',
            patientNotes: '',
            durationMinutes: null,
            createdAt: null,
            start: e.start,
            end: e.end,
            source: 'google',
            sourceLabel: 'Google Calendar',
            canDelete: true,
          };
        }),
      ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    };
  });

  const googleOAuthReady = Boolean(
    Deno.env.get('GOOGLE_CLIENT_ID') && Deno.env.get('GOOGLE_CLIENT_SECRET'),
  );

  return json({
    calendar,
    schedule,
    bookings,
    weekDays,
    rangeLabel,
    monthOffset,
    monthStart,
    monthEnd,
    todayKey,
    todayBookings,
    stats: {
      today: todayBookings.length + todayGoogle.length,
      range: rangeBookings.length + unlinkedGoogle.length,
      fromGoogle: unlinkedGoogle.length,
      fromSite: rangeBookings.length,
    },
    topServices,
    googleOAuthReady,
    stripeReady: isStripeConfigured(),
    depositAmountMxn: schedule.depositAmountMxn,
    paymentUrl: schedule.paymentUrl,
  });
});
