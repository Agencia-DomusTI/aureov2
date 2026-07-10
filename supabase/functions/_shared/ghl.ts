const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';
const DEFAULT_LOCATION = 'C6shsXK6KDZS3bqsrcMJ';

type Patient = { name: string; phone: string; email?: string; notes?: string };

function getToken() {
  return Deno.env.get('GHL_API_TOKEN') ?? Deno.env.get('GHL_TOKEN') ?? '';
}

function getLocationId() {
  return Deno.env.get('GHL_LOCATION_ID') ?? DEFAULT_LOCATION;
}

function getCalendarId() {
  return Deno.env.get('GHL_CALENDAR_ID') ?? '';
}

export function isGhlConfigured() {
  return Boolean(getToken());
}

function ghlHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function ghlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...options,
    headers: { ...ghlHeaders(), ...(options.headers as Record<string, string> ?? {}) },
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    console.error('GHL API error', path, res.status, text);
    throw new Error((data.message as string) || (data.error as string) || `GHL ${res.status}`);
  }
  return data;
}

async function findContactByPhone(phone: string) {
  const locationId = getLocationId();
  const number = encodeURIComponent(normalizePhone(phone));
  try {
    const data = await ghlFetch(
      `/contacts/search/duplicate?locationId=${locationId}&number=${number}`,
    );
    return (data.contact as { id: string })?.id ?? null;
  } catch {
    return null;
  }
}

async function upsertContact(patient: Patient, service: string) {
  const locationId = getLocationId();
  const phone = normalizePhone(patient.phone);
  const { firstName, lastName } = splitName(patient.name);

  const payload: Record<string, unknown> = {
    locationId,
    firstName,
    lastName: lastName || undefined,
    phone,
    email: patient.email || undefined,
    source: 'Aureo Clinique Web',
    tags: ['cita-web', 'aureo-queretaro', 'reserva-online'],
  };

  if (patient.notes) {
    payload.customFields = [{ key: 'notas_cita', field_value: patient.notes }];
  }

  const existingId = await findContactByPhone(phone).catch(() => null);
  if (existingId) {
    await ghlFetch(`/contacts/${existingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        tags: ['cita-web', 'aureo-queretaro', 'reserva-online', service.slice(0, 40)],
      }),
    }).catch(() => {});
    return existingId;
  }

  const created = await ghlFetch('/contacts/', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      tags: [...(payload.tags as string[]), service.slice(0, 40)],
    }),
  });

  return (created.contact as { id: string })?.id
    ?? (created.id as string)
    ?? null;
}

async function resolveCalendarId() {
  const configured = getCalendarId();
  if (configured) return configured;

  const locationId = getLocationId();
  const data = await ghlFetch(`/calendars/?locationId=${locationId}`);
  const calendars = (data.calendars as Array<{ id: string }>) ?? [];
  return calendars[0]?.id ?? '';
}

async function createGhlAppointment(opts: {
  contactId: string;
  service: string;
  start: string;
  end: string;
  patient: Patient;
  confirmationCode?: string;
  depositAmountMxn?: number;
}) {
  const calendarId = await resolveCalendarId();
  if (!calendarId) return null;

  const locationId = getLocationId();
  const data = await ghlFetch('/calendars/events/appointments', {
    method: 'POST',
    body: JSON.stringify({
      calendarId,
      locationId,
      contactId: opts.contactId,
      startTime: opts.start,
      endTime: opts.end,
      title: `${opts.service} — ${opts.patient.name}`,
      appointmentStatus: 'confirmed',
      description: [
        opts.confirmationCode ? `Código: ${opts.confirmationCode}` : '',
        `Servicio: ${opts.service}`,
        opts.depositAmountMxn !== undefined && opts.depositAmountMxn > 0
          ? `Anticipo: $${opts.depositAmountMxn} MXN`
          : '',
        `Tel: ${opts.patient.phone}`,
        opts.patient.email ? `Email: ${opts.patient.email}` : '',
        opts.patient.notes ? `Notas: ${opts.patient.notes}` : '',
        'Reservado desde aureoclinique.com',
      ].filter(Boolean).join('\n'),
    }),
  });

  return (data.id as string)
    ?? (data.appointment as { id: string })?.id
    ?? null;
}

export async function deleteGhlAppointment(appointmentId: string) {
  if (!isGhlConfigured() || !appointmentId) {
    return { deleted: false, reason: 'GHL no configurado o sin ID de cita' };
  }

  try {
    const res = await fetch(`${GHL_BASE}/calendars/events/${encodeURIComponent(appointmentId)}`, {
      method: 'DELETE',
      headers: ghlHeaders(),
      body: '{}',
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      console.error('GHL delete appointment:', res.status, text);
      return { deleted: false, reason: text };
    }

    return { deleted: true };
  } catch (err) {
    console.error('GHL delete appointment error:', err);
    return { deleted: false, reason: (err as Error).message };
  }
}

/** Registra/actualiza el contacto (lead) en GHL. Se hace siempre al reservar. */
export async function upsertGhlContact(patient: Patient, service: string) {
  if (!isGhlConfigured()) {
    return { synced: false, contactId: null as string | null, reason: 'GHL_API_TOKEN no configurado' };
  }
  try {
    const contactId = await upsertContact(patient, service);
    return {
      synced: Boolean(contactId),
      contactId,
      reason: contactId ? undefined : 'No se pudo crear contacto en GHL',
    };
  } catch (err) {
    console.error('GHL contact error:', err);
    return { synced: false, contactId: null as string | null, reason: (err as Error).message };
  }
}

/** Crea la cita en GHL para un contacto ya existente. Se hace al confirmarse el pago. */
export async function createBookingGhlAppointment(opts: {
  contactId: string;
  service: string;
  start: string;
  end: string;
  patient: Patient;
  confirmationCode?: string;
  depositAmountMxn?: number;
}) {
  if (!isGhlConfigured() || !opts.contactId) return null;
  try {
    return await createGhlAppointment(opts);
  } catch (err) {
    console.error('GHL appointment error:', err);
    return null;
  }
}

export async function syncBookingToGhl(booking: {
  service: string;
  start: string;
  end: string;
  patient: Patient;
  confirmationCode?: string;
  depositAmountMxn?: number;
}) {
  if (!isGhlConfigured()) {
    return { synced: false, reason: 'GHL_API_TOKEN no configurado' };
  }

  try {
    const contactId = await upsertContact(booking.patient, booking.service);
    if (!contactId) {
      return { synced: false, reason: 'No se pudo crear contacto en GHL' };
    }

    let appointmentId: string | null = null;
    try {
      appointmentId = await createGhlAppointment({
        contactId,
        ...booking,
      });
    } catch (err) {
      console.error('GHL appointment error:', err);
    }

    return { synced: true, contactId, appointmentId };
  } catch (err) {
    console.error('GHL sync error:', err);
    return { synced: false, reason: (err as Error).message };
  }
}
