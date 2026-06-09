import { createServiceClient, getClinicSettings, handleCors, json, verifyAdmin } from '../_shared/utils.ts';
import { fetchCalendarEvents, getCalendarStatus } from '../_shared/google.ts';
import { isStripeConfigured } from '../_shared/stripe.ts';

const TZ = 'America/Mexico_City';

function mxDateKey(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

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
    source: 'site' as const,
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  const supabase = createServiceClient();
  const now = new Date();
  const todayKey = mxDateKey(now);
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekStartIso = weekStart.toISOString();
  const weekEndIso = weekEnd.toISOString();

  const [calendar, schedule, bookingsRes, weekBookingsRes, allBookingsRes] = await Promise.all([
    getCalendarStatus(supabase),
    getClinicSettings(supabase),
    supabase.from('bookings').select('*').order('start_at', { ascending: false }).limit(50),
    supabase.from('bookings').select('*')
      .gte('start_at', weekStartIso)
      .lt('start_at', weekEndIso)
      .order('start_at', { ascending: true }),
    supabase.from('bookings').select('service'),
  ]);

  const bookings = (bookingsRes.data ?? []).map(mapBooking);
  const weekBookings = (weekBookingsRes.data ?? []).map(mapBooking);

  let googleEvents: Array<{ id: string; title: string; start: string; end: string; source: string }> = [];
  if (calendar.connected) {
    googleEvents = await fetchCalendarEvents(supabase, weekStartIso, weekEndIso);
  }

  const todayBookings = weekBookings.filter((b) => mxDateKey(new Date(b.start as string)) === todayKey);
  const todayGoogle = googleEvents.filter((e) => e.start && mxDateKey(new Date(e.start)) === todayKey);

  function serviceFromTitle(title: string) {
    const dash = title.split(/\s[-–—]\s/);
    return (dash.length > 1 ? dash[dash.length - 1] : title).trim();
  }

  const serviceCounts: Record<string, number> = {};
  (allBookingsRes.data ?? []).forEach((b) => {
    const s = b.service as string;
    serviceCounts[s] = (serviceCounts[s] ?? 0) + 1;
  });
  googleEvents.forEach((e) => {
    const s = serviceFromTitle(e.title);
    if (s) serviceCounts[s] = (serviceCounts[s] ?? 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = mxDateKey(d);
    const dayBookings = weekBookings.filter((b) => mxDateKey(new Date(b.start as string)) === key);
    const dayGoogle = googleEvents.filter((e) => e.start && mxDateKey(new Date(e.start)) === key);
    return {
      date: key,
      label: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', timeZone: TZ }),
      isToday: key === todayKey,
      count: dayBookings.length + dayGoogle.length,
      appointments: [
        ...dayBookings.map((b) => ({
          id: b.id,
          title: b.service,
          subtitle: b.patient.name,
          start: b.start,
          end: b.end,
          source: 'site',
        })),
        ...dayGoogle.map((e) => ({
          id: e.id,
          title: e.title,
          subtitle: 'Google Calendar',
          start: e.start,
          end: e.end,
          source: 'google',
        })),
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
    todayBookings,
    stats: {
      today: todayBookings.length + todayGoogle.length,
      week: weekBookings.length + googleEvents.length,
      fromGoogle: googleEvents.length,
      fromSite: weekBookings.length,
    },
    topServices,
    googleOAuthReady,
    stripeReady: isStripeConfigured(),
    depositAmountMxn: schedule.depositAmountMxn,
    paymentUrl: schedule.paymentUrl,
  });
});
