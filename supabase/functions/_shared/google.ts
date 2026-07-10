import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

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
  return data;
}

export async function refreshAccessToken(supabase: SupabaseClient) {
  const stored = await getStoredConnection(supabase);
  if (!stored?.refresh_token) return null;

  if (stored.access_token && stored.expires_at && new Date(stored.expires_at) > new Date(Date.now() + 60_000)) {
    return { token: stored.access_token, calendarId: stored.calendar_id || 'primary' };
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

  if (!res.ok) return null;
  const data = await res.json();
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString();

  await supabase.from('google_calendar_connection').update({
    access_token: data.access_token,
    expires_at: expiresAt,
    refresh_token: data.refresh_token ?? stored.refresh_token,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);

  return { token: data.access_token, calendarId: stored.calendar_id || 'primary' };
}

export async function isGoogleConnected(supabase: SupabaseClient) {
  const stored = await getStoredConnection(supabase);
  return Boolean(stored?.refresh_token);
}

export async function fetchBusyPeriods(supabase: SupabaseClient, dateStr: string) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) return [];

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
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

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
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

export async function fetchCalendarEvents(
  supabase: SupabaseClient,
  timeMin: string,
  timeMax: string,
) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) return [];

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  );

  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((ev: {
    id: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  }) => ({
    id: ev.id,
    title: ev.summary ?? 'Sin título',
    description: ev.description ?? '',
    start: ev.start?.dateTime ?? ev.start?.date,
    end: ev.end?.dateTime ?? ev.end?.date,
    source: 'google' as const,
  }));
}

export async function deleteCalendarEvent(supabase: SupabaseClient, eventId: string) {
  const auth = await refreshAccessToken(supabase);
  if (!auth) throw new Error('Google Calendar no conectado');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } },
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(await res.text());
  }
  return true;
}

export async function getCalendarStatus(supabase: SupabaseClient) {
  const stored = await getStoredConnection(supabase);
  if (!stored?.refresh_token) return { connected: false };
  return {
    connected: true,
    email: stored.email,
    calendarId: stored.calendar_id,
    connectedAt: stored.connected_at,
  };
}
