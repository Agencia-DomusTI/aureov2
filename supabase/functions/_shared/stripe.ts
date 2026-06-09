export async function createDepositCheckout(opts: {
  amountMxn: number;
  serviceName: string;
  patientName: string;
  bookingId: string;
}) {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://aureoclinique.com';
  if (!secret) return null;

  const amount = Math.max(50, Math.round(opts.amountMxn));
  const params = new URLSearchParams({
    mode: 'payment',
    success_url: `${siteUrl}/#contacto?pago=ok`,
    cancel_url: `${siteUrl}/#contacto?pago=cancel`,
    'line_items[0][price_data][currency]': 'mxn',
    'line_items[0][price_data][unit_amount]': String(amount * 100),
    'line_items[0][price_data][product_data][name]': `Anticipo — ${opts.serviceName}`,
    'line_items[0][price_data][product_data][description]': `Cita de ${opts.patientName}`,
    'line_items[0][quantity]': '1',
    'metadata[booking_id]': opts.bookingId,
    'metadata[service]': opts.serviceName,
  });

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
  return data.url as string;
}

export function isStripeConfigured() {
  return Boolean(Deno.env.get('STRIPE_SECRET_KEY'));
}
