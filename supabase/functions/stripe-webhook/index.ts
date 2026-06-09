import { createServiceClient, handleCors, json } from '../_shared/utils.ts';
import { sendBookingConfirmationEmail } from '../_shared/email.ts';

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('raw', key, new TextEncoder().encode(signed));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  // Sin secret no podemos verificar la autenticidad del evento. Respondemos
  // 200 (para que Stripe no reintente en bucle) pero NO procesamos: la
  // confirmación segura del pago la hace confirm-payment contra Stripe.
  if (!webhookSecret) {
    console.warn('stripe-webhook: STRIPE_WEBHOOK_SECRET no configurado; se ignora el evento.');
    return json({ received: true, skipped: 'no_secret' });
  }

  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) {
    console.error('stripe-webhook: firma inválida');
    return json({ error: 'Firma inválida' }, 400);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata as Record<string, string> | undefined;
      const supabase = createServiceClient();
      const update = {
        deposit_paid: true,
        payment_status: 'paid',
        stripe_session_id: session.id as string,
      };

      let booking: Record<string, unknown> | null = null;

      if (metadata?.booking_id) {
        const { data } = await supabase
          .from('bookings')
          .update(update)
          .eq('id', metadata.booking_id)
          .select('*')
          .maybeSingle();
        booking = data;
      } else if (typeof session.client_reference_id === 'string') {
        const { data } = await supabase
          .from('bookings')
          .update(update)
          .eq('confirmation_code', session.client_reference_id)
          .select('*')
          .maybeSingle();
        booking = data;
      }

      if (booking) {
        const customerEmail =
          (booking.patient_email as string | null) ||
          ((session.customer_details as Record<string, unknown> | undefined)?.email as string | undefined) ||
          (session.customer_email as string | undefined) ||
          null;

        // El correo no debe tumbar el webhook si falla.
        try {
          await sendBookingConfirmationEmail({
            service: booking.service as string,
            startAt: booking.start_at as string,
            endAt: booking.end_at as string,
            patientName: booking.patient_name as string,
            patientEmail: customerEmail,
            confirmationCode: booking.confirmation_code as string,
            depositAmountMxn: booking.deposit_amount_mxn as number | null,
            paid: true,
          });
        } catch (mailErr) {
          console.error('stripe-webhook: error enviando correo:', (mailErr as Error).message);
        }
      } else {
        console.warn('stripe-webhook: no se encontró la reserva para actualizar.');
      }
    }
  } catch (err) {
    console.error('stripe-webhook: error procesando evento:', (err as Error).message);
    return json({ error: 'Error procesando evento' }, 500);
  }

  return json({ received: true });
});
