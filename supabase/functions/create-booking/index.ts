import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';
import { createCalendarEvent, fetchBusyPeriods, isGoogleConnected } from '../_shared/google.ts';

const BUFFER_MS = 10 * 60 * 1000;

function overlaps(start: number, end: number, busy: { start: string; end: string }[]) {
  return busy.some((b) => {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return start < bEnd + BUFFER_MS && end + BUFFER_MS > bStart;
  });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'JSON inválido' }, 400);
  }

  const { service, durationMinutes, start, end, patient } = body;
  if (!service || !start || !end || !patient?.name || !patient?.phone) {
    return json({ success: false, message: 'Faltan campos requeridos' }, 400);
  }

  const supabase = createServiceClient();

  if (!(await isGoogleConnected(supabase))) {
    return json({
      success: false,
      message: 'Calendario no conectado. Confirma por WhatsApp.',
      code: 'GOOGLE_NOT_CONFIGURED',
    }, 503);
  }

  const dateStr = start.slice(0, 10);
  const busy = await fetchBusyPeriods(supabase, dateStr);
  const slotStart = new Date(start).getTime();
  const slotEnd = new Date(end).getTime();

  if (overlaps(slotStart, slotEnd, busy)) {
    return json({ success: false, message: 'Ese horario ya no está disponible.' }, 409);
  }

  try {
    const event = await createCalendarEvent(supabase, body);
    await supabase.from('bookings').insert({
      event_id: event.id,
      service,
      duration_minutes: durationMinutes,
      start_at: start,
      end_at: end,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_email: patient.email || null,
      patient_notes: patient.notes || null,
    });

    const settings = await getClinicSettings(supabase);
    const paymentNote = settings.paymentUrl
      ? ' Recibirás el link de pago por WhatsApp.'
      : ' Te contactaremos para confirmar y compartir el link de pago.';

    return json({
      success: true,
      eventId: event.id,
      paymentUrl: settings.paymentUrl || null,
      message: `Tu cita de ${service} quedó registrada.${paymentNote}`,
    });
  } catch (err) {
    return json({ success: false, message: (err as Error).message }, 500);
  }
});
