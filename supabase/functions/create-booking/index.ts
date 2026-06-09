import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';
import { createCalendarEvent, fetchBusyPeriods, isGoogleConnected } from '../_shared/google.ts';
import { syncBookingToGhl } from '../_shared/ghl.ts';
import { createDepositCheckout, isStripeConfigured } from '../_shared/stripe.ts';
import { createUniqueConfirmationCode, getServiceDeposit } from '../_shared/booking.ts';

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

  const settings = await getClinicSettings(supabase);
  const deposit = getServiceDeposit(settings, service);
  const serviceOverride = settings.servicesConfig?.[service];
  const confirmationCode = await createUniqueConfirmationCode(supabase);
  const paymentRequired = deposit > 0;

  try {
    const event = await createCalendarEvent(supabase, {
      ...body,
      confirmationCode,
      depositAmountMxn: deposit,
    });
    const ghlSync = await syncBookingToGhl({
      service,
      start,
      end,
      patient,
      confirmationCode,
      depositAmountMxn: deposit,
    });

    let paymentUrl: string | null = null;
    let stripeSessionId: string | null = null;
    let paymentStatus = paymentRequired ? 'pending' : 'waived';

    const { data: bookingRow } = await supabase.from('bookings').insert({
      event_id: event.id,
      service,
      duration_minutes: durationMinutes,
      start_at: start,
      end_at: end,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_email: patient.email || null,
      patient_notes: patient.notes || null,
      ghl_contact_id: ghlSync.contactId ?? null,
      ghl_appointment_id: ghlSync.appointmentId ?? null,
      confirmation_code: confirmationCode,
      deposit_amount_mxn: deposit,
      payment_status: paymentStatus,
    }).select('id').single();

    if (paymentRequired && bookingRow?.id) {
      if (isStripeConfigured()) {
        const checkout = await createDepositCheckout({
          amountMxn: deposit,
          serviceName: service,
          patientName: patient.name,
          patientPhone: patient.phone,
          patientEmail: patient.email,
          bookingId: bookingRow.id,
          confirmationCode,
          priceLabel: serviceOverride?.priceLabel,
        });
        if (checkout) {
          paymentUrl = checkout.url;
          stripeSessionId = checkout.sessionId;
          await supabase.from('bookings').update({
            stripe_session_id: stripeSessionId,
          }).eq('id', bookingRow.id);
        }
      } else if (settings.paymentUrl) {
        paymentUrl = settings.paymentUrl;
      }
    }

    const message = paymentRequired && paymentUrl
      ? `Tu horario quedó apartado. Completa el anticipo de $${deposit} MXN para confirmar tu cita de ${service}.`
      : paymentRequired && !paymentUrl
        ? `Tu horario quedó apartado. Código ${confirmationCode}. Te contactaremos para el anticipo de $${deposit} MXN.`
        : `¡Tu cita de ${service} quedó confirmada! Tu código es ${confirmationCode}.`;

    return json({
      success: true,
      eventId: event.id,
      confirmationCode,
      paymentUrl,
      depositAmountMxn: deposit,
      paymentRequired,
      confirmed: !paymentRequired || !paymentUrl,
      ghlSynced: ghlSync.synced,
      message,
    });
  } catch (err) {
    return json({ success: false, message: (err as Error).message }, 500);
  }
});
