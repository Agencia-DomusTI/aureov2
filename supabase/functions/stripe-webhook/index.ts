import { createServiceClient, handleCors, json } from '../_shared/utils.ts';

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
  if (!webhookSecret) {
    return json({ error: 'Webhook no configurado' }, 500);
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) {
    return json({ error: 'Firma inválida' }, 400);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata as Record<string, string> | undefined;
    const supabase = createServiceClient();
    const update = {
      deposit_paid: true,
      payment_status: 'paid',
      stripe_session_id: session.id as string,
    };

    if (metadata?.booking_id) {
      await supabase.from('bookings').update(update).eq('id', metadata.booking_id);
    } else if (typeof session.client_reference_id === 'string') {
      await supabase.from('bookings').update(update).eq('confirmation_code', session.client_reference_id);
    }
  }

  return json({ received: true });
});
