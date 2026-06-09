import { createServiceClient, handleCors, json } from '../_shared/utils.ts';
import { fetchBusyPeriods, isGoogleConnected } from '../_shared/google.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const duration = parseInt(url.searchParams.get('duration') || '60', 10);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'Parámetro date inválido' }, 400);
  }

  const supabase = createServiceClient();
  let busy: { start: string; end: string }[] = [];
  let googleConnected = false;

  if (await isGoogleConnected(supabase)) {
    busy = await fetchBusyPeriods(supabase, date);
    googleConnected = true;
  }

  return json({ date, duration, busy, googleConnected, timezone: 'America/Mexico_City' });
});
