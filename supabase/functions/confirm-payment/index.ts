import { createServiceClient, handleCors, json } from '../_shared/utils.ts';
import { getCheckoutSession } from '../_shared/stripe.ts';
import { sendPaidBookingEmails } from '../_shared/email.ts';

/**
 * Verificación de respaldo del pago al volver de Stripe.
 * El sitio llama aquí con el código de confirmación; consultamos la sesión
 * en Stripe y, si está pagada, marcamos la reserva y enviamos el correo.
 * Funciona aunque el webhook no esté configurado.
 */
Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ paid: false, message: 'JSON inválido' }, 400);
  }

  const code = (body?.code ?? '').toString().trim();
  if (!code) return json({ paid: false, message: 'Falta el código' }, 400);

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('confirmation_code', code)
    .maybeSingle();

  if (!booking) return json({ paid: false, message: 'Reserva no encontrada' }, 404);

  if (booking.deposit_paid || booking.payment_status === 'paid') {
    return json({ paid: true, alreadyPaid: true });
  }

  if (!booking.stripe_session_id) {
    return json({ paid: false, message: 'Sin sesión de pago asociada' });
  }

  const session = await getCheckoutSession(booking.stripe_session_id as string);
  const isPaid = session?.payment_status === 'paid' || session?.status === 'complete';

  if (!isPaid) {
    return json({ paid: false, message: 'El pago aún no se confirma' });
  }

  await supabase
    .from('bookings')
    .update({ deposit_paid: true, payment_status: 'paid' })
    .eq('id', booking.id);

  await sendPaidBookingEmails(booking, {
    patientEmail: (booking.patient_email as string | null) ??
      (session?.customer_details?.email as string | undefined) ?? null,
  });

  return json({ paid: true });
});
