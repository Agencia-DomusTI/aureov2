import { buildDepositsMap, getBaseDeposit, isServiceActive } from '../_shared/booking.ts';
import { isStripeConfigured } from '../_shared/stripe.ts';
import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createServiceClient();
  const config = await getClinicSettings(supabase);
  const baseDeposit = getBaseDeposit(config);
  const servicesConfig = config.servicesConfig ?? {};
  const inactiveServiceIds = Object.keys(servicesConfig).filter(
    (id) => !isServiceActive(id, servicesConfig),
  );
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
    servicesConfig,
    inactiveServiceIds,
    serviceDeposits: buildDepositsMap(servicesConfig, baseDeposit),
    stripeEnabled: isStripeConfigured(),
  });
});
