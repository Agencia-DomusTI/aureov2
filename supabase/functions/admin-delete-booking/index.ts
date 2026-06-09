import { deleteCalendarEvent } from '../_shared/google.ts';
import { createServiceClient, handleCors, json, verifyAdmin } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { source?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const { source, id } = body;
  if (!source || !id) {
    return json({ error: 'source e id requeridos' }, 400);
  }

  const supabase = createServiceClient();

  try {
    if (source === 'site') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!booking) {
        return json({ error: 'Reserva no encontrada' }, 404);
      }

      if (booking.event_id) {
        await deleteCalendarEvent(supabase, booking.event_id).catch((err) => {
          console.error('Google delete:', err);
        });
      }

      await supabase.from('bookings').delete().eq('id', id);
      return json({ success: true, message: 'Cita eliminada' });
    }

    if (source === 'google') {
      await deleteCalendarEvent(supabase, id);

      const { data: linked } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', id)
        .maybeSingle();

      if (linked) {
        await supabase.from('bookings').delete().eq('id', linked.id);
      }

      return json({ success: true, message: 'Cita eliminada de Google Calendar' });
    }

    return json({ error: 'source inválido' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
