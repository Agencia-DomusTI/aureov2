const TZ = 'America/Mexico_City';

export function mxDateKey(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

export function mxWeekday(d: Date): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

export function mxDayNum(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: 'numeric' }).format(d),
    10,
  );
}

function parseMxKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m, d };
}

function formatMxKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Referencia estable dentro del día en zona México. */
export function mxKeyToDate(key: string): Date {
  const { y, m, d } = parseMxKey(key);
  let guess = new Date(Date.UTC(y, m - 1, d, 18, 0, 0));
  const target = formatMxKey(y, m, d);
  for (let i = 0; i < 48; i++) {
    if (mxDateKey(guess) === target) return guess;
    guess = new Date(guess.getTime() + 3600000);
  }
  return guess;
}

export function addMxDays(key: string, days: number): string {
  const dt = mxKeyToDate(key);
  dt.setUTCDate(dt.getUTCDate() + days);
  return mxDateKey(dt);
}

export function startOfWeekMx(d: Date = new Date()): string {
  const key = mxDateKey(d);
  const wd = mxWeekday(d);
  const diff = wd === 0 ? -6 : 1 - wd;
  return addMxDays(key, diff);
}

export function mxDayStartIso(key: string): string {
  let t = mxKeyToDate(key);
  for (let i = 0; i < 36; i++) {
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(t),
      10,
    );
    if (mxDateKey(t) === key && hour === 0) return t.toISOString();
    t = new Date(t.getTime() - 3600000);
  }
  return mxKeyToDate(key).toISOString();
}

export function mxDayEndIso(key: string): string {
  return mxDayStartIso(addMxDays(key, 1));
}

export function formatMxLabel(key: string, style: 'long' | 'short' = 'long'): string {
  const d = mxKeyToDate(key);
  if (style === 'short') {
    return d.toLocaleDateString('es-MX', { weekday: 'short', timeZone: TZ });
  }
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
}

export function formatMxMonthYear(key: string): string {
  return mxKeyToDate(key).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: TZ });
}

export function formatMxRangeLabel(startKey: string, endKey: string): string {
  const start = mxKeyToDate(startKey);
  const end = mxKeyToDate(endKey);
  const a = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: TZ });
  const b = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
  return `${a} – ${b}`;
}

export { TZ };
