import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Invoca una Edge Function de Supabase */
export async function invokeFunction(name, options = {}) {
  const { data, error } = await supabase.functions.invoke(name, options);
  if (error) throw error;
  return data;
}

/** GET con query params en functions que usan URL search */
export async function fetchFunction(name, params = {}) {
  const base = `${supabaseUrl}/functions/v1/${name}`;
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${base}?${qs}` : base;

  const session = await supabase.auth.getSession();
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session.data.session?.access_token ?? supabaseAnonKey}`,
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Error ${res.status}`);
  }
  return res.json();
}
