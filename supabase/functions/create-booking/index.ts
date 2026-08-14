import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';
import { isGoogleConnected } from '../_shared/google.ts';
import { upsertGhlContact } from '../_shared/ghl.ts';
import { createDepositCheckout, isStripeConfigured } from '../_shared/stripe.ts';
import { sendBookingConfirmationEmail } from '../_shared/email.ts';
import {
  createUniqueConfirmationCode,
  fetchDayCapacity,
  finalizePaidBooking,
  getServiceDeposit,
  isServiceActive,
} from '../_shared/booking.ts';
import { canAccommodate, classifyService } from '../_shared/capacity.ts';

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

  const { service, serviceId, durationMinutes, start, end, patient } = body;
  if (!service || !start || !end || !patient?.name || !patient?.phone) {
    return json({ success: false, message: 'Faltan campos requeridos' }, 400);
  }

  const serviceKey = (typeof serviceId === 'string' && serviceId.trim()) || service;

  const supabase = createServiceClient();
  const settings = await getClinicSettings(supabase);

  if (!(await isGoogleConnected(supabase))) {
    return json({
      success: false,
      message: 'Calendario no conectado. Confirma por WhatsApp.',
      code: 'GOOGLE_NOT_CONFIGURED',
    }, 503);
  }

  if (!isServiceActive(serviceKey, settings.servicesConfig)) {
    return json({
      success: false,
      message: 'Este servicio no está disponible para reservas en línea.',
      code: 'SERVICE_INACTIVE',
    }, 400);
  }

  const dateStr = start.slice(0, 10);
  const { occupancy, hardBlocks } = await fetchDayCapacity(supabase, dateStr);
  const slotStart = new Date(start).getTime();
  const slotEnd = new Date(end).getTime();
  const resource = classifyService(service);
  const bufferMs = (settings.bufferMinutes ?? 10) * 60 * 1000;

  if (!canAccommodate({
    pool: resource.pool,
    machine: resource.machine,
    slotStart,
    slotEnd,
    occupancy,
    hardBlocks,
    bufferMs,
  })) {
    return json({ success: false, message: 'Ese horario ya no está disponible.' }, 409);
  }

  const deposit = getServiceDeposit(settings, serviceKey);
  const confirmationCode = await createUniqueConfirmationCode(supabase);
  const paymentRequired = deposit > 0;

  try {
    // El lead se registra siempre en GHL. La cita en GHL y el evento en Google
    // solo se crean cuando la reserva queda confirmada (pago recibido o servicio
    // sin anticipo) — no antes.
    const ghlContact = await upsertGhlContact(patient, service);

    let paymentUrl: string | null = null;
    let stripeSessionId: string | null = null;
    const paymentStatus = paymentRequired ? 'pending' : 'waived';

    const { data: bookingRow, error: insertError } = await supabase.from('bookings').insert({
      event_id: null,
      service,
      duration_minutes: durationMinutes,
      start_at: start,
      end_at: end,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_email: patient.email || null,
      patient_notes: patient.notes || null,
      ghl_contact_id: ghlContact.contactId ?? null,
      ghl_appointment_id: null,
      confirmation_code: confirmationCode,
      deposit_amount_mxn: deposit,
      payment_status: paymentStatus,
      deposit_paid: false,
    }).select('*').single();

    if (insertError || !bookingRow) {
      throw new Error(insertError?.message ?? 'No se pudo guardar la reserva');
    }

    let eventId: string | null = null;

    if (paymentRequired) {
      // El horario queda apartado en la BD durante la ventana de pago. El evento en
      // Google y la cita en GHL se crean al confirmarse el pago (confirm-payment/webhook).
      if (isStripeConfigured()) {
        const checkout = await createDepositCheckout({
          amountMxn: deposit,
          serviceName: service,
          patientName: patient.name,
          patientPhone: patient.phone,
          patientEmail: patient.email,
          bookingId: bookingRow.id,
          confirmationCode,
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
    } else {
      // Sin anticipo: la cita queda confirmada de inmediato → evento, cita GHL y correo.
      await finalizePaidBooking(supabase, bookingRow, {
        patientEmail: patient.email || null,
        sendEmails: false,
      });
      const { data: refreshed } = await supabase
        .from('bookings')
        .select('event_id')
        .eq('id', bookingRow.id)
        .maybeSingle();
      eventId = (refreshed?.event_id as string | null) ?? null;

      if (patient.email) {
        await sendBookingConfirmationEmail({
          service,
          startAt: start,
          endAt: end,
          patientName: patient.name,
          patientEmail: patient.email,
          confirmationCode,
          depositAmountMxn: deposit,
          paid: false,
        });
      }
    }

    const message = paymentRequired && paymentUrl
      ? `Tu horario quedó apartado. Completa el anticipo de $${deposit} MXN para confirmar tu cita de ${service}.`
      : paymentRequired && !paymentUrl
        ? `Tu horario quedó apartado. Código ${confirmationCode}. Te contactaremos para el anticipo de $${deposit} MXN.`
        : `¡Tu cita de ${service} quedó confirmada! Tu código es ${confirmationCode}.`;

    return json({
      success: true,
      eventId,
      confirmationCode,
      paymentUrl,
      depositAmountMxn: deposit,
      paymentRequired,
      confirmed: !paymentRequired || !paymentUrl,
      ghlSynced: ghlContact.synced,
      message,
    });
  } catch (err) {
    return json({ success: false, message: (err as Error).message }, 500);
  }
});
