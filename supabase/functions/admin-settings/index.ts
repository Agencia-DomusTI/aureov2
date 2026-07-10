import { DEFAULT_DEPOSIT_MXN } from '../_shared/booking.ts';
import { createServiceClient, getClinicSettings, handleCors, json, verifyAdmin } from '../_shared/utils.ts';
import { isStripeConfigured } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  const supabase = createServiceClient();

  if (req.method === 'GET') {
    const settings = await getClinicSettings(supabase);
    return json({
      schedule: settings.schedule,
      scheduleSummary: settings.scheduleSummary,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      bufferMinutes: settings.bufferMinutes,
      paymentUrl: settings.paymentUrl,
      depositAmountMxn: settings.depositAmountMxn,
      servicesConfig: settings.servicesConfig,
      stripeReady: isStripeConfigured(),
    });
  }

  if (req.method === 'PUT') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'JSON inválido' }, 400);
    }

    const current = await getClinicSettings(supabase);
    const { error } = await supabase.from('clinic_settings').update({
      schedule: body.schedule ?? current.schedule,
      schedule_summary: body.scheduleSummary ?? current.scheduleSummary,
      slot_interval_minutes: body.slotIntervalMinutes ?? current.slotIntervalMinutes,
      buffer_minutes: body.bufferMinutes ?? current.bufferMinutes,
      payment_url: body.paymentUrl ?? current.paymentUrl,
      deposit_amount_mxn: body.depositAmountMxn ?? current.depositAmountMxn ?? DEFAULT_DEPOSIT_MXN,
      services_config: body.servicesConfig ?? current.servicesConfig,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    if (error) {
      console.error('admin-settings update:', error);
      return json({ error: error.message }, 500);
    }

    const updated = await getClinicSettings(supabase);
    return json({
      success: true,
      settings: {
        schedule: updated.schedule,
        scheduleSummary: updated.scheduleSummary,
        slotIntervalMinutes: updated.slotIntervalMinutes,
        bufferMinutes: updated.bufferMinutes,
        paymentUrl: updated.paymentUrl,
        depositAmountMxn: updated.depositAmountMxn,
        servicesConfig: updated.servicesConfig,
        stripeReady: isStripeConfigured(),
      },
    });
  }

  return json({ error: 'Method not allowed' }, 405);
});
