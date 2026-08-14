import { createServiceClient, handleCors, json } from '../_shared/utils.ts';
import { fetchDayCapacity } from '../_shared/booking.ts';

function parseRequest(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const duration = parseInt(url.searchParams.get('duration') || '60', 10);
  const service = url.searchParams.get('service') || url.searchParams.get('serviceId') || '';

  return { date, duration, service };
}

async function parsePostBody(req: Request) {
  try {
    const body = await req.json();
    return {
      date: body.date as string | undefined,
      duration: parseInt(String(body.duration ?? 60), 10),
      service: String(body.service ?? body.serviceId ?? ''),
    };
  } catch {
    return { date: undefined, duration: 60, service: '' };
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    let date: string | null | undefined;
    let duration: number;
    let service: string;

    if (req.method === 'POST') {
      const body = await parsePostBody(req);
      date = body.date;
      duration = body.duration;
      service = body.service;
    } else if (req.method === 'GET') {
      const parsed = parseRequest(req);
      date = parsed.date;
      duration = parsed.duration;
      service = parsed.service;
    } else {
      return json({ error: 'Method not allowed' }, 405);
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: 'Parámetro date inválido' }, 400);
    }

    const supabase = createServiceClient();
    const { occupancy, hardBlocks, googleConnected } = await fetchDayCapacity(supabase, date);

    return json({
      date,
      duration,
      service,
      occupancy,
      hardBlocks,
      googleConnected,
      timezone: 'America/Mexico_City',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return json({ error: message }, 500);
  }
});
