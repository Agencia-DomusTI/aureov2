import { deleteGhlAppointment } from '../_shared/ghl.ts';
import { deleteCalendarEvent } from '../_shared/google.ts';
import { createServiceClient, handleCors, json, verifyAdmin } from '../_shared/utils.ts';

async function removeExternalBooking(
  supabase: ReturnType<typeof createServiceClient>,
  booking: { event_id?: string | null; ghl_appointment_id?: string | null },
) {
  const results = { google: false, ghl: false };

  if (booking.event_id) {
    try {
      await deleteCalendarEvent(supabase, booking.event_id);
      results.google = true;
    } catch (err) {
      console.error('Google delete:', err);
    }
  }

  if (booking.ghl_appointment_id) {
    const ghlResult = await deleteGhlAppointment(booking.ghl_appointment_id);
    results.ghl = ghlResult.deleted;
    if (!ghlResult.deleted) {
      console.error('GHL delete:', ghlResult.reason);
    }
  }

  return results;
}

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

      const external = await removeExternalBooking(supabase, booking);
      await supabase.from('bookings').delete().eq('id', id);

      return json({
        success: true,
        message: 'Cita eliminada',
        removed: external,
      });
    }

    if (source === 'google') {
      const { data: linked } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', id)
        .maybeSingle();

      const external = await removeExternalBooking(supabase, {
        event_id: id,
        ghl_appointment_id: linked?.ghl_appointment_id,
      });

      if (linked) {
        await supabase.from('bookings').delete().eq('id', linked.id);
      }

      return json({
        success: true,
        message: 'Cita eliminada de Google Calendar y GHL',
        removed: external,
      });
    }

    return json({ error: 'source inválido' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
