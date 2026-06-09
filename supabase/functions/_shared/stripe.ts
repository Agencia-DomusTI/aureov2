export function isStripeConfigured() {
  return Boolean(Deno.env.get('STRIPE_SECRET_KEY'));
}

/** Recupera una Checkout Session para verificar el estado del pago. */
export async function getCheckoutSession(sessionId: string) {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret || !sessionId) return null;

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  if (!res.ok) {
    console.error('Stripe retrieve session error:', await res.text());
    return null;
  }
  return res.json();
}

export async function createDepositCheckout(opts: {
  amountMxn: number;
  serviceName: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  bookingId: string;
  confirmationCode: string;
  priceLabel?: string;
}) {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://aureoclinique.com';
  if (!secret) return null;

  const amount = Math.max(10, Math.round(opts.amountMxn));
  const code = encodeURIComponent(opts.confirmationCode);
  const priceNote = opts.priceLabel ? ` · ${opts.priceLabel}` : '';

  const params = new URLSearchParams({
    mode: 'payment',
    success_url: `${siteUrl}/?pago=ok&codigo=${code}#contacto`,
    cancel_url: `${siteUrl}/?pago=cancel&codigo=${code}#contacto`,
    client_reference_id: opts.confirmationCode,
    'line_items[0][price_data][currency]': 'mxn',
    'line_items[0][price_data][unit_amount]': String(amount * 100),
    'line_items[0][price_data][product_data][name]': `Anticipo — ${opts.serviceName}`,
    'line_items[0][price_data][product_data][description]':
      `Cita ${opts.confirmationCode} · ${opts.patientName}${priceNote}`,
    'line_items[0][quantity]': '1',
    'metadata[booking_id]': opts.bookingId,
    'metadata[confirmation_code]': opts.confirmationCode,
    'metadata[service]': opts.serviceName,
    'metadata[patient_name]': opts.patientName,
    'metadata[patient_phone]': opts.patientPhone ?? '',
  });

  if (opts.patientEmail) {
    params.set('customer_email', opts.patientEmail);
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!res.ok) {
    console.error('Stripe error:', await res.text());
    return null;
  }

  const data = await res.json();
  return {
    url: data.url as string,
    sessionId: data.id as string,
  };
}
