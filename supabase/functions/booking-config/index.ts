import { createServiceClient, getClinicSettings, handleCors, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createServiceClient();
  const config = await getClinicSettings(supabase);
  return json(config);
});
