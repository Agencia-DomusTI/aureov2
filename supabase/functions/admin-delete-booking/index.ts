import { deleteGhlAppointment } from '../_shared/ghl.ts';
import { deleteCalendarEvent } from '../_shared/google.ts';
import {
  bookingRowToEmailData,
  sendBookingConfirmationEmail,
  sendDoctorBookingNotificationEmail,
} from '../_shared/email.ts';
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

function isBookingPaid(booking: Record<string, unknown>) {
  return Boolean(booking.deposit_paid) || booking.payment_status === 'paid';
}

async function notifyBookingEmail(
  booking: Record<string, unknown>,
  includePatient: boolean,
) {
  if (!isBookingPaid(booking)) {
    return { ok: false, skipped: true, reason: 'not_paid' as const };
  }

  const data = bookingRowToEmailData(booking, { paid: true });
  const doctorOk = await sendDoctorBookingNotificationEmail(data);
  let patientOk: boolean | null = null;

  if (includePatient && data.patientEmail) {
    patientOk = await sendBookingConfirmationEmail(data);
  }

  return { ok: doctorOk, skipped: false, doctorOk, patientOk };
}

async function handleResendEmail(
  supabase: ReturnType<typeof createServiceClient>,
  body: { id?: string; all?: boolean; includePatient?: boolean },
) {
  const includePatient = Boolean(body.includePatient);

  if (body.all) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or('deposit_paid.eq.true,payment_status.eq.paid')
      .order('start_at', { ascending: false });

    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const booking of bookings ?? []) {
      const result = await notifyBookingEmail(booking, includePatient);
      if (result.skipped) continue;
      if (result.ok) sent++;
      else failed++;
    }

    return json({
      success: true,
      total: bookings?.length ?? 0,
      sent,
      failed,
      message: `Correos al doctor: ${sent} enviados${failed ? `, ${failed} fallidos` : ''}.`,
    });
  }

  const id = body.id?.trim();
  if (!id) return json({ error: 'id o all requerido' }, 400);

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!booking) return json({ error: 'Reserva no encontrada' }, 404);
  if (!isBookingPaid(booking)) {
    return json({ error: 'Esta reserva aún no tiene el anticipo pagado' }, 400);
  }

  const result = await notifyBookingEmail(booking, includePatient);
  if (!result.ok) {
    return json({ error: 'No se pudo enviar el correo. Revisa RESEND_API_KEY.' }, 502);
  }

  return json({
    success: true,
    doctorOk: result.doctorOk,
    patientOk: result.patientOk,
    message: includePatient && result.patientOk
      ? 'Correos reenviados al doctor y al paciente.'
      : 'Correo reenviado al doctor.',
  });
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

  let body: {
    action?: string;
    source?: string;
    id?: string;
    all?: boolean;
    includePatient?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const supabase = createServiceClient();

  if (body.action === 'resend-email') {
    try {
      return await handleResendEmail(supabase, body);
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  const { source, id } = body;
  if (!source || !id) {
    return json({ error: 'source e id requeridos' }, 400);
  }

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
