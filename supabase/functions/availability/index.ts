import { createServiceClient, handleCors, json } from '../_shared/utils.ts';
import { fetchBusyPeriods, isGoogleConnected } from '../_shared/google.ts';

function parseRequest(req: Request) {
  const url = new URL(req.url);
  let date = url.searchParams.get('date');
  let duration = parseInt(url.searchParams.get('duration') || '60', 10);

  return { date, duration };
}

async function parsePostBody(req: Request) {
  try {
    const body = await req.json();
    return {
      date: body.date as string | undefined,
      duration: parseInt(String(body.duration ?? 60), 10),
    };
  } catch {
    return { date: undefined, duration: 60 };
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    let date: string | null | undefined;
    let duration: number;

    if (req.method === 'POST') {
      const body = await parsePostBody(req);
      date = body.date;
      duration = body.duration;
    } else if (req.method === 'GET') {
      const parsed = parseRequest(req);
      date = parsed.date;
      duration = parsed.duration;
    } else {
      return json({ error: 'Method not allowed' }, 405);
    }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return json({ error: message }, 500);
  }
});
