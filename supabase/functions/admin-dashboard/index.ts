import { createServiceClient, getClinicSettings, handleCors, json, verifyAdmin } from '../_shared/utils.ts';
import { getCalendarStatus } from '../_shared/google.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  const supabase = createServiceClient();
  const [calendar, schedule, bookingsRes] = await Promise.all([
    getCalendarStatus(supabase),
    getClinicSettings(supabase),
    supabase.from('bookings').select('*').order('start_at', { ascending: false }).limit(20),
  ]);

  const googleOAuthReady = Boolean(
    Deno.env.get('GOOGLE_CLIENT_ID') && Deno.env.get('GOOGLE_CLIENT_SECRET'),
  );

  return json({
    calendar,
    schedule,
    bookings: (bookingsRes.data ?? []).map((b) => ({
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
    })),
    googleOAuthReady,
    paymentUrl: schedule.paymentUrl,
  });
});
