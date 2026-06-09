import { handleCors, json } from '../_shared/utils.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return json({ error: 'Asistente no configurado' }, 503);

  let body: { messages?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'messages requerido' }, 400);
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages,
      temperature: 0.2,
      max_tokens: 280,
      top_p: 0.85,
      frequency_penalty: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return json(
      { error: (err as { error?: { message?: string } })?.error?.message || `Error del asistente (${res.status})` },
      res.status,
    );
  }

  const data = await res.json();
  const reply = (data?.choices?.[0]?.message?.content as string | undefined)?.trim();
  if (!reply) return json({ error: 'No hubo respuesta del asistente' }, 500);

  return json({ reply });
});
