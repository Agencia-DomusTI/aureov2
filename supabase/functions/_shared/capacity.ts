/**
 * Capacidad real de la clínica (Querétaro).
 * Debe mantenerse alineado con src/constants/bookingCapacity.js
 *
 * A. Sueros / ozono: 3 espacios simultáneos (cualquier mezcla).
 * B. Consultorio: 2 salas. 4 máquinas (1 de cada una); nunca 2 del mismo tipo.
 */

export const INFUSION_CAPACITY = 3;
export const CONSULTORIO_CAPACITY = 2;

export const POOL = {
  infusion: 'infusion',
  consultorio: 'consultorio',
} as const;

export const MACHINE = {
  picosegundo: 'picosegundo',
  criolipolisis: 'criolipolisis',
  depilacion: 'depilacion',
  hidrofacial: 'hidrofacial',
} as const;

export type PoolId = typeof POOL[keyof typeof POOL];
export type MachineId = typeof MACHINE[keyof typeof MACHINE] | null;

export type Resource = {
  pool: PoolId;
  machine: MachineId;
};

export type OccupancyItem = {
  start: string | number;
  end: string | number;
  service?: string;
  pool: PoolId;
  machine: MachineId;
};

export type TimePeriod = {
  start: string | number;
  end: string | number;
};

const CONSULTORIO_GENERIC: Resource = { pool: POOL.consultorio, machine: null };

const SERVICE_RESOURCE: Record<string, Resource> = {
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

function normalize(text: string) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const RESOURCE_BY_NORMALIZED: Record<string, Resource> = {};
for (const [name, resource] of Object.entries(SERVICE_RESOURCE)) {
  RESOURCE_BY_NORMALIZED[normalize(name)] = resource;
}

function classifyByKeywords(normalized: string): Resource {
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

export function classifyService(serviceName: string): Resource {
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

export function parseServiceFromTitle(title: string) {
  const raw = String(title || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s[-–—]\s/);
  return (parts[0] || raw).trim();
}

export function periodsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  bufferMs = 0,
) {
  return aStart < bEnd + bufferMs && aEnd + bufferMs > bStart;
}

function toMs(value: string | number) {
  if (typeof value === 'number') return value;
  return new Date(value).getTime();
}

export function canAccommodate({
  pool,
  machine,
  slotStart,
  slotEnd,
  occupancy = [],
  hardBlocks = [],
  bufferMs = 0,
}: {
  pool: PoolId;
  machine: MachineId;
  slotStart: number;
  slotEnd: number;
  occupancy?: OccupancyItem[];
  hardBlocks?: TimePeriod[];
  bufferMs?: number;
}) {
  if (hardBlocks.some((block) => (
    periodsOverlap(slotStart, slotEnd, toMs(block.start), toMs(block.end), bufferMs)
  ))) {
    return false;
  }

  const overlapping = occupancy.filter((item) => (
    periodsOverlap(slotStart, slotEnd, toMs(item.start), toMs(item.end), bufferMs)
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

export function toOccupancyItem(serviceName: string, start: string, end: string): OccupancyItem {
  const resource = classifyService(serviceName);
  return {
    start,
    end,
    service: serviceName,
    pool: resource.pool,
    machine: resource.machine,
  };
}

export function isSiteCreatedGoogleEvent(description?: string | null) {
  const d = (description ?? '').toLowerCase();
  return d.includes('aureoclinique.com') || d.includes('reservado desde');
}
