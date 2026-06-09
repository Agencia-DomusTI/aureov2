import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado en el sitio');
  }
}

/** Invoca Edge Functions públicas (booking) */
export async function invokeFunction(name, options = {}) {
  assertConfigured();

  const { data, error } = await supabase.functions.invoke(name, {
    method: options.method ?? 'POST',
    body: options.body ?? undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    throw new Error(error.message || `Error al llamar ${name}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/** Consulta pública — usa POST para evitar bloqueos CORS en GET */
export async function fetchFunction(name, params = {}) {
  return invokeFunction(name, { method: 'POST', body: params });
}
