import { createServiceClient } from '../_shared/utils.ts';
import { exchangeCodeForTokens, fetchGoogleEmail } from '../_shared/google.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
  const adminUrl = `${siteUrl}/admin?tab=calendario`;

  if (error) {
    return Response.redirect(`${adminUrl}&error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${adminUrl}&error=parametros_invalidos`, 302);
  }

  const supabase = createServiceClient();
  const { data: stateRow } = await supabase.from('oauth_states').select('state').eq('state', state).single();

  if (!stateRow) {
    return Response.redirect(`${adminUrl}&error=estado_invalido`, 302);
  }
  await supabase.from('oauth_states').delete().eq('state', state);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    await supabase.from('google_calendar_connection').upsert({
      id: 1,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expires_at: expiresAt,
      email,
      calendar_id: 'primary',
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return Response.redirect(`${adminUrl}&connected=1`, 302);
  } catch (err) {
    return Response.redirect(
      `${adminUrl}&error=${encodeURIComponent((err as Error).message)}`,
      302,
    );
  }
});
