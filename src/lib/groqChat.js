const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export function isGroqConfigured() {
  return Boolean(import.meta.env.VITE_GROQ_API_KEY?.trim());
}

export async function sendGroqMessage(messages) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('El asistente no está configurado. Agrega VITE_GROQ_API_KEY.');
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 280,
      top_p: 0.85,
      frequency_penalty: 0.3,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Error del asistente (${res.status})`);
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('No hubo respuesta del asistente.');
  return reply;
}
