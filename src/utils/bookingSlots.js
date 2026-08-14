import { BOOKING_CONFIG as DEFAULT_CONFIG } from '../constants/booking';
import { canAccommodate, classifyService } from '../constants/bookingCapacity';

const MX_OFFSET = '-06:00';

function mxDate(dateStr, hour, minute = 0) {
  return new Date(
    `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${MX_OFFSET}`,
  );
}

function getConfig(config) {
  return config ?? DEFAULT_CONFIG;
}

function getDayOfWeek(dateStr) {
  return mxDate(dateStr, 12).getUTCDay();
}

function getWindowsForDate(dateStr, config) {
  const cfg = getConfig(config);
  const dow = getDayOfWeek(dateStr);
  if (dow === 0) return cfg.schedule.sunday === 'by_request' ? [] : [];
  if (dow === 6) return cfg.schedule.saturday;
  return cfg.schedule.weekday;
}

function overlaps(aStart, aEnd, bStart, bEnd, bufferMs) {
  return aStart < bEnd + bufferMs && aEnd + bufferMs > bStart;
}

function formatSlotLabel(date) {
  return date.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: getConfig().timezone,
  });
}

export function isSundayByRequest(dateStr) {
  return getDayOfWeek(dateStr) === 0;
}

export function isDateBookableOnline(dateStr, config) {
  const cfg = getConfig(config);
  const today = getTodayInMexico(cfg);
  if (dateStr < today) return false;

  const max = new Date(`${today}T12:00:00${MX_OFFSET}`);
  max.setDate(max.getDate() + cfg.maxAdvanceDays);
  const maxStr = max.toISOString().slice(0, 10);
  if (dateStr > maxStr) return false;

  const dow = getDayOfWeek(dateStr);
  if (dow === 0) return false;
  return true;
}

export function getTodayInMexico(config) {
  const cfg = getConfig(config);
  return new Date().toLocaleDateString('en-CA', { timeZone: cfg.timezone });
}

/**
 * Genera horarios disponibles.
 * Con `serviceName` usa capacidad paralela (3 sueros/ozono + 2 consultorios).
 * Sin servicio, `occupancy` se trata como bloqueo exclusivo (compatibilidad).
 */
export function generateTimeSlots(
  dateStr,
  durationMinutes,
  occupancy = [],
  config,
  options = {},
) {
  const cfg = getConfig(config);
  if (!isDateBookableOnline(dateStr, cfg)) return [];

  const windows = getWindowsForDate(dateStr, cfg);
  const { slotIntervalMinutes, bufferMinutes, minAdvanceHours } = cfg;
  const bufferMs = bufferMinutes * 60 * 1000;
  const minStart = Date.now() + minAdvanceHours * 60 * 60 * 1000;
  const slots = [];
  const serviceName = options.serviceName;
  const resource = serviceName ? classifyService(serviceName) : null;
  const hardBlocks = options.hardBlocks ?? [];

  for (const [startHour, endHour] of windows) {
    let cursorMinutes = startHour * 60;
    const windowEndMinutes = endHour * 60;

    while (cursorMinutes + durationMinutes <= windowEndMinutes) {
      const hour = Math.floor(cursorMinutes / 60);
      const minute = cursorMinutes % 60;
      const slotStart = mxDate(dateStr, hour, minute);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      if (slotStart.getTime() >= minStart) {
        const available = resource
          ? canAccommodate({
            pool: resource.pool,
            machine: resource.machine,
            slotStart: slotStart.getTime(),
            slotEnd: slotEnd.getTime(),
            occupancy,
            hardBlocks,
            bufferMs,
          })
          : !occupancy.some((period) => {
            const bStart = new Date(period.start).getTime();
            const bEnd = new Date(period.end).getTime();
            return overlaps(slotStart.getTime(), slotEnd.getTime(), bStart, bEnd, bufferMs);
          }) && !hardBlocks.some((period) => {
            const bStart = new Date(period.start).getTime();
            const bEnd = new Date(period.end).getTime();
            return overlaps(slotStart.getTime(), slotEnd.getTime(), bStart, bEnd, bufferMs);
          });

        if (available) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: formatSlotLabel(slotStart),
          });
        }
      }

      cursorMinutes += slotIntervalMinutes;
    }
  }

  return slots;
}

export function getMonthDays(year, month, config) {
  const cfg = getConfig(config);
  const last = new Date(Date.UTC(year, month + 1, 0));
  const days = [];

  for (let d = 1; d <= last.getUTCDate(); d += 1) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateStr,
      day: d,
      bookable: isDateBookableOnline(dateStr, cfg),
      sunday: getDayOfWeek(dateStr) === 0,
    });
  }

  return days;
}
