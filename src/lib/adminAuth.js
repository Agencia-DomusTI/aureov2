import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabase';

const TOKEN_KEY = 'aureo_admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminRequest(functionName, { method = 'GET', body, params } = {}) {
  const token = getAdminToken();
  if (!token) throw new Error('No autorizado');

  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${supabaseUrl}/functions/v1/${functionName}${qs}`;

  const res = await fetch(url, {
    method,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

async function publicRequest(functionName, { method = 'POST', body } = {}) {
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Error ${res.status}`);
  return data;
}

export async function adminLogin(email, password) {
  const data = await publicRequest('admin-login', { body: { email, password } });
  setAdminToken(data.token);
  return data;
}

export async function adminMe() {
  if (!getAdminToken()) return null;
  try {
    return await adminRequest('admin-me');
  } catch {
    clearAdminToken();
    return null;
  }
}

export async function adminInvoke(functionName, options = {}) {
  return adminRequest(functionName, options);
}

export async function adminFetch(functionName, params = {}) {
  return adminRequest(functionName, { params });
}

export { isSupabaseConfigured };
