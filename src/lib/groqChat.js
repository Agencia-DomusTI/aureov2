import { fetchFunction } from './supabase.js';

export function isGroqConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function sendGroqMessage(messages) {
  const data = await fetchFunction('chat-assistant', { messages });
  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error('No hubo respuesta del asistente.');
  return data.reply;
}
