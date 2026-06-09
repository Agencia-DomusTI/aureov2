import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createServiceClient();
  const config = await getClinicSettings(supabase);
  return json({
    timezone: config.timezone,
    timezoneLabel: config.timezoneLabel,
    slotIntervalMinutes: config.slotIntervalMinutes,
    bufferMinutes: config.bufferMinutes,
    minAdvanceHours: config.minAdvanceHours,
    maxAdvanceDays: config.maxAdvanceDays,
    schedule: config.schedule,
    scheduleSummary: config.scheduleSummary,
    depositAmountMxn: config.depositAmountMxn,
    servicesConfig: config.servicesConfig,
  });
});
