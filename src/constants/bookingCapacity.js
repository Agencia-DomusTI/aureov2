/**
 * Capacidad real de la clínica (Querétaro).
 *
 * A. Sueros / ozono: 3 espacios simultáneos (cualquier mezcla).
 * B. Consultorio: 2 salas. 4 máquinas (1 de cada una); nunca 2 del mismo tipo.
 *
 * En la web solo se agenda la primera cita; las siguientes las carga el doctor
 * a mano (Google / admin) y también consumen capacidad.
 */

export const INFUSION_CAPACITY = 3;
export const CONSULTORIO_CAPACITY = 2;

export const POOL = {
  infusion: 'infusion',
  consultorio: 'consultorio',
};

export const MACHINE = {
  picosegundo: 'picosegundo',
  criolipolisis: 'criolipolisis',
  depilacion: 'depilacion',
  hidrofacial: 'hidrofacial',
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CONSULTORIO_GENERIC = { pool: POOL.consultorio, machine: null };

/** Mapa exacto del catálogo → recurso. Lo no listado usa consultorio (sin máquina). */
const SERVICE_RESOURCE = {
  Ozonoterapia: { pool: POOL.infusion, machine: null },
  'Suero NAD': { pool: POOL.infusion, machine: null },
  Glutatión: { pool: POOL.infusion, machine: null },
  'Suero Energy': { pool: POOL.infusion, machine: null },
  'Suero Detox': { pool: POOL.infusion, machine: null },
  'Suero Health': { pool: POOL.infusion, machine: null },
  'Suero C-Max (Vitamina C)': { pool: POOL.infusion, machine: null },
  'Suero Quelación': { pool: POOL.infusion, machine: null },
  'Suero Neuro Hormonal': { pool: POOL.infusion, machine: null },
  'Células Madre': { pool: POOL.infusion, machine: null },
  'Células Madre en Diabéticos': { pool: POOL.infusion, machine: null },
  'Células Madre (Prevención y Longevidad)': { pool: POOL.infusion, machine: null },
  'Inmunoterapia (NK y Linfocitos)': { pool: POOL.infusion, machine: null },
  'Células Dendríticas': { pool: POOL.infusion, machine: null },

  'Hollywood Peel (Pico Láser)': { pool: POOL.consultorio, machine: MACHINE.picosegundo },
  'Melasma (Pico Segundo)': { pool: POOL.consultorio, machine: MACHINE.picosegundo },
  'Eliminación de Microblading': { pool: POOL.consultorio, machine: MACHINE.picosegundo },
  'Eliminación de Manchas en Manos': { pool: POOL.consultorio, machine: MACHINE.picosegundo },
  'Eliminación de Tatuajes (Pico Láser)': { pool: POOL.consultorio, machine: MACHINE.picosegundo },

  Criolipólisis: { pool: POOL.consultorio, machine: MACHINE.criolipolisis },
  'Criolipólisis (Paquetes)': { pool: POOL.consultorio, machine: MACHINE.criolipolisis },
  'Ice Pro Criolipólisis': { pool: POOL.consultorio, machine: MACHINE.criolipolisis },

  'Depilación Láser': { pool: POOL.consultorio, machine: MACHINE.depilacion },
  Hidrofacial: { pool: POOL.consultorio, machine: MACHINE.hidrofacial },
};

const RESOURCE_BY_NORMALIZED = Object.fromEntries(
  Object.entries(SERVICE_RESOURCE).map(([name, resource]) => [normalize(name), resource]),
);

function classifyByKeywords(normalized) {
  if (!normalized) return CONSULTORIO_GENERIC;

  if (/\bhidrofacial\b|\bhydrofacial\b/.test(normalized)) {
    return { pool: POOL.consultorio, machine: MACHINE.hidrofacial };
  }
  if (/\bdepilacion\b/.test(normalized)) {
    return { pool: POOL.consultorio, machine: MACHINE.depilacion };
  }
  if (/\bcriolipolisis\b|\bice pro\b/.test(normalized)) {
    return { pool: POOL.consultorio, machine: MACHINE.criolipolisis };
  }
  if (
    /\bpico\b/.test(normalized) ||
    /\btatuaje/.test(normalized) ||
    /\bhollywood peel\b/.test(normalized) ||
    /\bmelasma\b/.test(normalized) ||
    /\bmicroblading\b/.test(normalized) ||
    /\bmanchas\b/.test(normalized)
  ) {
    return { pool: POOL.consultorio, machine: MACHINE.picosegundo };
  }
  if (
    /\bsuero\b/.test(normalized) ||
    /\bozono/.test(normalized) ||
    /\bglutation\b/.test(normalized) ||
    /\bquelacion\b/.test(normalized) ||
    /\bnad\b/.test(normalized) ||
    /\bneuro hormonal\b/.test(normalized) ||
    (/\bcelulas madre\b/.test(normalized) && !/\brodilla\b/.test(normalized)) ||
    /\binmunoterapia\b/.test(normalized) ||
    /\bcelulas dendriticas\b/.test(normalized)
  ) {
    return { pool: POOL.infusion, machine: null };
  }

  return CONSULTORIO_GENERIC;
}

export function classifyService(serviceName) {
  const exact = SERVICE_RESOURCE[serviceName];
  if (exact) return exact;

  const normalized = normalize(serviceName);
  if (RESOURCE_BY_NORMALIZED[normalized]) return RESOURCE_BY_NORMALIZED[normalized];

  const titleService = parseServiceFromTitle(serviceName);
  if (titleService !== serviceName) {
    const fromTitle = SERVICE_RESOURCE[titleService] || RESOURCE_BY_NORMALIZED[normalize(titleService)];
    if (fromTitle) return fromTitle;
  }

  return classifyByKeywords(normalized);
}

export function parseServiceFromTitle(title) {
  const raw = String(title || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s[-–—]\s/);
  return (parts[0] || raw).trim();
}

export function periodsOverlap(aStart, aEnd, bStart, bEnd, bufferMs = 0) {
  return aStart < bEnd + bufferMs && aEnd + bufferMs > bStart;
}

/**
 * ¿Cabe una cita nueva en este rango, dadas las ocupaciones y bloqueos duros?
 * `occupancy` = citas que ya consumen un recurso ({ start, end, pool, machine }).
 * `hardBlocks` = el doctor no está (junta, bloqueo) → ningún servicio cabe.
 */
export function canAccommodate({
  pool,
  machine,
  slotStart,
  slotEnd,
  occupancy = [],
  hardBlocks = [],
  bufferMs = 0,
}) {
  const start = Number(slotStart);
  const end = Number(slotEnd);

  if (hardBlocks.some((block) => (
    periodsOverlap(start, end, toMs(block.start), toMs(block.end), bufferMs)
  ))) {
    return false;
  }

  const overlapping = occupancy.filter((item) => (
    periodsOverlap(start, end, toMs(item.start), toMs(item.end), bufferMs)
  ));

  if (pool === POOL.infusion) {
    const used = overlapping.filter((item) => item.pool === POOL.infusion).length;
    return used < INFUSION_CAPACITY;
  }

  const rooms = overlapping.filter((item) => item.pool === POOL.consultorio);
  if (rooms.length >= CONSULTORIO_CAPACITY) return false;
  if (machine && rooms.some((item) => item.machine === machine)) return false;
  return true;
}

function toMs(value) {
  if (typeof value === 'number') return value;
  return new Date(value).getTime();
}

export function toOccupancyItem(serviceName, start, end) {
  const resource = classifyService(serviceName);
  return {
    start,
    end,
    service: serviceName,
    pool: resource.pool,
    machine: resource.machine,
  };
}
