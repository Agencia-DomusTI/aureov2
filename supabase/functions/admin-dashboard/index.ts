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

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function isBookingPaid(b: Record<string, unknown>) {
  return Boolean(b.deposit_paid) || b.payment_status === 'paid';
}

function isPaidSiteBooking(b: ReturnType<typeof mapBooking>) {
  return Boolean(b.depositPaid) || b.paymentStatus === 'paid';
}

type GoogleAnalyticsEvent = { start: string; title: string };

function countAppointment(
  startKey: string,
  monthStart: string,
  monthEnd: string,
  todayKey: string,
  byMonth: Record<string, { bookings: number; revenue: number }>,
  byService: Record<string, { total: number; paid: number }>,
  weekdayCounts: number[],
  serviceName: string,
  counters: { upcoming: number; thisMonth: number; googleThisMonth: number },
  isGoogle = false,
) {
  if (startKey >= todayKey) counters.upcoming++;
  if (startKey >= monthStart && startKey <= monthEnd) {
    counters.thisMonth++;
    if (isGoogle) counters.googleThisMonth++;
    const d = mxKeyToDate(startKey);
    const jsDay = d.getDay();
    const wd = jsDay === 0 ? 6 : jsDay - 1;
    weekdayCounts[wd]++;
  }

  if (!byService[serviceName]) byService[serviceName] = { total: 0, paid: 0 };
  byService[serviceName].total++;
  if (!isGoogle) byService[serviceName].paid++;

  const monthKey = startKey.slice(0, 7);
  if (!byMonth[monthKey]) byMonth[monthKey] = { bookings: 0, revenue: 0 };
  byMonth[monthKey].bookings++;
}

function buildAnalytics(
  rows: Record<string, unknown>[],
  googleEvents: GoogleAnalyticsEvent[],
  monthStart: string,
  monthEnd: string,
  todayKey: string,
) {
  let revenueMxn = 0;
  let paidCount = 0;
  let pendingCount = 0;
  const counters = { upcoming: 0, thisMonth: 0, googleThisMonth: 0, sitePaidThisMonth: 0 };

  const byService: Record<string, { total: number; paid: number }> = {};
  const byMonth: Record<string, { bookings: number; revenue: number }> = {};
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

  for (const b of rows) {
    const startKey = mxDateKey(new Date(b.start_at as string));
    const paid = isBookingPaid(b);
    const amount = Number(b.deposit_amount_mxn) || 0;

    if (paid) {
      paidCount++;
      revenueMxn += amount;
    } else if (b.payment_status === 'pending') {
      pendingCount++;
    }

    if (paid) {
      countAppointment(
        startKey,
        monthStart,
        monthEnd,
        todayKey,
        byMonth,
        byService,
        weekdayCounts,
        String(b.service ?? 'Sin servicio'),
        counters,
      );
      if (startKey >= monthStart && startKey <= monthEnd) counters.sitePaidThisMonth++;
    }

    const monthKey = startKey.slice(0, 7);
    if (!byMonth[monthKey]) byMonth[monthKey] = { bookings: 0, revenue: 0 };
    if (paid) byMonth[monthKey].revenue += amount;
  }

  for (const e of googleEvents) {
    if (!e.start) continue;
    const startKey = mxDateKey(new Date(e.start));
    const svc = serviceFromTitle(e.title) || 'Google Calendar';
    countAppointment(
      startKey,
      monthStart,
      monthEnd,
      todayKey,
      byMonth,
      byService,
      weekdayCounts,
      svc,
      counters,
      true,
    );
  }

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const offset = i - 5;
    const mStart = addMxMonths(startOfMonthMx(todayKey), offset);
    const mk = mStart.slice(0, 7);
    const data = byMonth[mk] ?? { bookings: 0, revenue: 0 };
    return {
      key: mk,
      label: formatMxMonthYear(mStart),
      bookings: data.bookings,
      revenue: data.revenue,
    };
  });

  const topServices = Object.entries(byService)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([name, v]) => ({ name, count: v.total, paid: v.paid }));

  const byWeekday = weekdayCounts.map((count, i) => ({
    day: WEEKDAY_LABELS[i],
    count,
  }));

  const conversionRate = rows.length > 0 ? Math.round((paidCount / rows.length) * 100) : 0;

  return {
    totals: {
      allTime: rows.length,
      thisMonth: counters.thisMonth,
      sitePaidThisMonth: counters.sitePaidThisMonth,
      fromGoogle: counters.googleThisMonth,
      upcoming: counters.upcoming,
      paid: paidCount,
      pending: pendingCount,
      revenueMxn,
      conversionRate,
      googleInRange: googleEvents.length,
    },
    monthlyTrend,
    byWeekday,
    topServices,
  };
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

  const analyticsRangeStart = addMxMonths(startOfMonthMx(todayKey), -5);
  const analyticsRangeEnd = endOfMonthMx(todayKey);
  const analyticsRangeStartIso = mxDayStartIso(analyticsRangeStart);
  const analyticsRangeEndIso = mxDayEndIso(analyticsRangeEnd);

  const [calendar, schedule, bookingsRes, rangeBookingsRes, allBookingsRes, analyticsRes, analyticsRangeRes] =
    await Promise.all([
      getCalendarStatus(supabase),
      getClinicSettings(supabase),
      supabase.from('bookings').select('*').order('start_at', { ascending: false }).limit(80),
      supabase.from('bookings').select('*')
        .gte('start_at', rangeStartIso)
        .lt('start_at', rangeEndIso)
        .order('start_at', { ascending: true }),
      supabase.from('bookings').select('service'),
      supabase.from('bookings').select(
        'service, start_at, deposit_amount_mxn, deposit_paid, payment_status',
      ),
      supabase.from('bookings').select('*')
        .gte('start_at', analyticsRangeStartIso)
        .lt('start_at', analyticsRangeEndIso),
    ]);

  // Calendario: solo reservas del sitio pagadas + Google sin duplicar.
  // Lista `bookings` incluye todas las reservas recientes (también pendientes).
  const bookings = (bookingsRes.data ?? []).map(mapBooking);
  const rangeBookingsAll = (rangeBookingsRes.data ?? []).map(mapBooking);
  // En el calendario solo citas del sitio con anticipo pagado.
  const rangeBookings = rangeBookingsAll.filter(isPaidSiteBooking);

  let googleEvents: Array<{
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    source: string;
  }> = [];
  let analyticsGoogleEvents: typeof googleEvents = [];

  if (calendar.connected && !calendar.needsReauth) {
    [googleEvents, analyticsGoogleEvents] = await Promise.all([
      fetchCalendarEvents(supabase, rangeStartIso, rangeEndIso),
      fetchCalendarEvents(supabase, analyticsRangeStartIso, analyticsRangeEndIso),
    ]);
  }

  const allRangeRows = rangeBookingsRes.data ?? [];
  const linkedEventIds = new Set(
    allRangeRows.map((b) => b.event_id as string | null).filter(Boolean),
  );

  const isGoogleDuplicate = (e: { id: string; title?: string; start?: string; description?: string }) =>
    isGoogleEventDuplicate(e, rangeBookingsAll, linkedEventIds);

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

  const analyticsRangeBookings = (analyticsRangeRes.data ?? []).map(mapBooking);
  const analyticsLinkedIds = new Set(
    (analyticsRangeRes.data ?? [])
      .map((b) => b.event_id as string | null)
      .filter(Boolean),
  );
  const analyticsGoogleDeduped = analyticsGoogleEvents.filter(
    (e) => !isGoogleEventDuplicate(e, analyticsRangeBookings, analyticsLinkedIds),
  );

  const analytics = buildAnalytics(
    analyticsRes.data ?? [],
    analyticsGoogleDeduped,
    monthStart,
    monthEnd,
    todayKey,
  );

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
      fromSitePaid: rangeBookings.length,
    },
    topServices,
    analytics,
    googleOAuthReady,
    stripeReady: isStripeConfigured(),
    depositAmountMxn: schedule.depositAmountMxn,
    paymentUrl: schedule.paymentUrl,
  });
});
