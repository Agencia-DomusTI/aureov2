import { createServiceClient, handleCors, json, verifyAdmin } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  const supabase = createServiceClient();
  await supabase.from('google_calendar_connection').update({
    refresh_token: null,
    access_token: null,
    expires_at: null,
    email: null,
    connected_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);

  return json({ success: true, message: 'Calendario desconectado' });
});
