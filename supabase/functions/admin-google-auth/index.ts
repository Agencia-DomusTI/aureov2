import { createServiceClient, handleCors, json, verifyAdmin } from '../_shared/utils.ts';
import { buildGoogleAuthUrl } from '../_shared/google.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await verifyAdmin(req);
  } catch {
    return json({ error: 'No autorizado' }, 401);
  }

  if (!Deno.env.get('GOOGLE_CLIENT_ID') || !Deno.env.get('GOOGLE_CLIENT_SECRET')) {
    return json({ error: 'Google OAuth no configurado en Supabase Secrets' }, 503);
  }

  const state = crypto.randomUUID();
  const supabase = createServiceClient();
  await supabase.from('oauth_states').insert({ state });

  return json({ authUrl: buildGoogleAuthUrl(state) });
});
