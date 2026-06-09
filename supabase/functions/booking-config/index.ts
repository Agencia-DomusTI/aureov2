import { buildDepositsMap, getBaseDeposit } from '../_shared/booking.ts';
import { isStripeConfigured } from '../_shared/stripe.ts';
import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createServiceClient();
  const config = await getClinicSettings(supabase);
  const baseDeposit = getBaseDeposit(config);
  return json({
    timezone: config.timezone,
    timezoneLabel: config.timezoneLabel,
    slotIntervalMinutes: config.slotIntervalMinutes,
    bufferMinutes: config.bufferMinutes,
    minAdvanceHours: config.minAdvanceHours,
    maxAdvanceDays: config.maxAdvanceDays,
    schedule: config.schedule,
    scheduleSummary: config.scheduleSummary,
    depositAmountMxn: baseDeposit,
    servicesConfig: config.servicesConfig,
    serviceDeposits: buildDepositsMap(config.servicesConfig, baseDeposit),
    stripeEnabled: isStripeConfigured(),
  });
});
