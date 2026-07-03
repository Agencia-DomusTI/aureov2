import { formatDuration } from '../constants/booking';

export const CUSTOM_SERVICE_PREFIX = 'custom:';

export function isCustomServiceId(id) {
  return typeof id === 'string' && id.startsWith(CUSTOM_SERVICE_PREFIX);
}

export function createCustomServiceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${CUSTOM_SERVICE_PREFIX}${crypto.randomUUID()}`;
  }
  return `${CUSTOM_SERVICE_PREFIX}${Date.now().toString(36)}`;
}

export function getCustomServicesFromConfig(servicesConfig = {}) {
  return Object.entries(servicesConfig)
    .filter(([id, cfg]) => isCustomServiceId(id) && cfg?.custom)
    .map(([id, cfg]) => {
      const durationMinutes = cfg.durationMinutes > 0 ? cfg.durationMinutes : 60;
      return {
        id,
        name: cfg.name?.trim() || 'Servicio',
        category: cfg.category?.trim() || 'Personalizado',
        categoryKey: 'custom',
        durationMinutes,
        durationLabel: formatDuration(durationMinutes),
        price: cfg.priceLabel ?? '',
        custom: true,
      };
    });
}

export function buildCustomServiceConfig({
  name,
  category,
  durationMinutes = 60,
  priceLabel = '',
  depositMxn,
  active = true,
}) {
  return {
    custom: true,
    name: name.trim(),
    category: category.trim(),
    durationMinutes: Math.max(15, Math.round(durationMinutes) || 60),
    priceLabel: priceLabel.trim(),
    depositMxn: depositMxn === '' || depositMxn === undefined ? undefined : Math.max(0, Number(depositMxn)),
    active,
  };
}
