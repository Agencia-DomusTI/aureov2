import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export type GoogleAuth = {
  token: string;
  calendarId: string;
};

type StoredConnection = {
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: string | null;
  calendar_id?: string | null;
  email?: string | null;
  connected_at?: string | null;
};

/** Evita que dos refrescos en paralelo invaliden el refresh_token. */
let refreshInFlight: Promise<GoogleAuth | null> | null = null;

export function getRedirectUri() {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/admin-google-callback`;
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchGoogleEmail(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}

export async function getStoredConnection(supabase: SupabaseClient) {
  const { data } = await supabase.from('google_calendar_connection').select('*').eq('id', 1).single();
  return data as StoredConnection | null;
}

function calendarIdOf(stored: StoredConnection | null) {
  return stored?.calendar_id || 'primary';
}

function googleErrorMessage(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: string; error_description?: string };
    if (parsed.error === 'invalid_grant') {
      return 'La sesión de Google caducó o fue revocada. Vuelve a conectar el calendario.';
    }
    return parsed.error_description || parsed.error || body.slice(0, 200);
  } catch {
    return body.slice(0, 200);
  }
}

async function refreshAccessTokenInner(
  supabase: SupabaseClient,
  opts?: { force?: boolean },
): Promise<GoogleAuth | null> {
  const stored = await getStoredConnection(supabase);
  if (!stored?.refresh_token) return null;

  const stillValid = stored.access_token &&
    stored.expires_at &&
    new Date(stored.expires_at).getTime() > Date.now() + 60_000;

  if (!opts?.force && stillValid) {
    return { token: stored.access_token as string, calendarId: calendarIdOf(stored) };
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: stored.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Google token refresh failed:', res.status, body);
    return null;
  }

  const data = await res.json() as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!data.access_token) {
    console.error('Google token refresh: sin access_token');
    return null;
  }

  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString();

  await supabase.from('google_calendar_connection').update({
    access_token: data.access_token,
    expires_at: expiresAt,
    refresh_token: data.refresh_token || stored.refresh_token,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);

  return { token: data.access_token, calendarId: calendarIdOf(stored) };
}

export async function refreshAccessToken(
  supabase: SupabaseClient,
  opts?: { force?: boolean },
): Promise<GoogleAuth | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = refreshAccessTokenInner(supabase, opts).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function isGoogleConnected(supabase: SupabaseClient) {
  const stored = await getStoredConnection(supabase);
  return Boolean(stored?.refresh_token);
}

async function googleApiFetch(
  supabase: SupabaseClient,
  url: string,
  init: RequestInit = {},
  retried = false,
): Promise<Response> {
  const auth = await refreshAccessToken(supabase, { force: retried });
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Google Calendar no conectado' }), { status: 401 });
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${auth.token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !retried) {
    return googleApiFetch(supabase, url, init, true);
  }
  return res;
}

export async function fetchBusyPeriods(supabase: SupabaseClient, dateStr: string) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) return [];

  const res = await googleApiFetch(supabase, 'https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: `${dateStr}T00:00:00-06:00`,
      timeMax: `${dateStr}T23:59:59-06:00`,
      timeZone: 'America/Mexico_City',
      items: [{ id: auth.calendarId }],
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const cal = data.calendars?.[auth.calendarId];
  return (cal?.busy ?? []).map((b: { start: string; end: string }) => ({ start: b.start, end: b.end }));
}

export async function createCalendarEvent(
  supabase: SupabaseClient,
  booking: {
    service: string;
    durationMinutes: number;
    start: string;
    end: string;
    patient: { name: string; phone: string; email?: string; notes?: string };
    confirmationCode?: string;
    depositAmountMxn?: number;
  },
) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) throw new Error('Google Calendar no conectado');

  const { service, durationMinutes, start, end, patient, confirmationCode, depositAmountMxn } = booking;
  const description = [
    confirmationCode ? `Código: ${confirmationCode}` : '',
    `Servicio: ${service}`,
    `Duración: ${durationMinutes} min`,
    depositAmountMxn !== undefined && depositAmountMxn > 0
      ? `Anticipo: $${depositAmountMxn} MXN`
      : depositAmountMxn === 0 ? 'Anticipo: no aplica' : '',
    `Paciente: ${patient.name}`,
    `Teléfono: ${patient.phone}`,
    patient.email ? `Email: ${patient.email}` : '',
    patient.notes ? `Notas: ${patient.notes}` : '',
    '',
    'Reservado desde aureoclinique.com',
  ].filter(Boolean).join('\n');

  const res = await googleApiFetch(
    supabase,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `${service} — ${patient.name}`,
        description,
        start: { dateTime: start, timeZone: 'America/Mexico_City' },
        end: { dateTime: end, timeZone: 'America/Mexico_City' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 24 * 60 },
          ],
        },
      }),
    },
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function bookingRowToCalendarInput(booking: Record<string, unknown>) {
  return {
    service: booking.service as string,
    durationMinutes: (booking.duration_minutes as number) ?? 0,
    start: booking.start_at as string,
    end: booking.end_at as string,
    patient: {
      name: booking.patient_name as string,
      phone: booking.patient_phone as string,
      email: (booking.patient_email as string | null) ?? undefined,
      notes: (booking.patient_notes as string | null) ?? undefined,
    },
    confirmationCode: (booking.confirmation_code as string | null) ?? undefined,
    depositAmountMxn: (booking.deposit_amount_mxn as number | null) ?? undefined,
  };
}

/**
 * Crea el evento en Google Calendar para una reserva y guarda el event_id, solo si
 * aún no tiene uno. Idempotente: si la reserva ya tiene event_id no hace nada. Se
 * llama al confirmarse el pago (o al reservar un servicio sin anticipo).
 */
export async function ensureCalendarEventForBooking(
  supabase: SupabaseClient,
  booking: Record<string, unknown>,
): Promise<string | null> {
  if (booking.event_id) return booking.event_id as string;
  if (!(await isGoogleConnected(supabase))) return null;

  const event = await createCalendarEvent(supabase, bookingRowToCalendarInput(booking));
  await supabase.from('bookings').update({ event_id: event.id }).eq('id', booking.id);
  return (event.id as string) ?? null;
}

type GoogleEventItem = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function mapCalendarEvent(ev: GoogleEventItem) {
  return {
    id: ev.id,
    title: ev.summary ?? 'Sin título',
    description: ev.description ?? '',
    start: ev.start?.dateTime ?? ev.start?.date,
    end: ev.end?.dateTime ?? ev.end?.date,
    source: 'google' as const,
  };
}

export async function fetchCalendarEvents(
  supabase: SupabaseClient,
  timeMin: string,
  timeMax: string,
) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) return [];

  const items: GoogleEventItem[] = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
      showDeleted: 'false',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await googleApiFetch(
      supabase,
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events?${params}`,
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('Google events list failed:', res.status, body);
      break;
    }

    const data = await res.json() as { items?: GoogleEventItem[]; nextPageToken?: string };
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return items.map(mapCalendarEvent);
}

export async function deleteCalendarEvent(supabase: SupabaseClient, eventId: string) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) throw new Error('Google Calendar no conectado');

  const res = await googleApiFetch(
    supabase,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(await res.text());
  }
  return true;
}

export async function getCalendarStatus(supabase: SupabaseClient) {
  const stored = await getStoredConnection(supabase);
  if (!stored?.refresh_token) {
    return { connected: false, healthy: false, needsReauth: false };
  }

  const base = {
    connected: true,
    email: stored.email,
    calendarId: calendarIdOf(stored),
    connectedAt: stored.connected_at,
  };

  const auth = await refreshAccessToken(supabase);
  if (!auth) {
    return {
      ...base,
      healthy: false,
      needsReauth: true,
      error: 'La sesión de Google caducó. Vuelve a conectar el calendario para ver las citas.',
    };
  }

  const ping = await googleApiFetch(
    supabase,
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
  );

  if (!ping.ok) {
    const body = await ping.text();
    console.error('Google calendar ping failed:', ping.status, body);
    return {
      ...base,
      healthy: false,
      needsReauth: ping.status === 401,
      error: ping.status === 401
        ? 'La sesión de Google caducó. Vuelve a conectar el calendario para ver las citas.'
        : `Google Calendar no respondió (${ping.status}). ${googleErrorMessage(body)}`,
    };
  }

  return {
    ...base,
    healthy: true,
    needsReauth: false,
  };
}
