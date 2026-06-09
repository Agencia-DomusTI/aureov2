import { SERVICE_DURATIONS, formatDuration } from '../constants/booking';

export function getServiceDurationMinutes(serviceId, servicesConfig = {}) {
  const override = servicesConfig[serviceId]?.durationMinutes;
  if (typeof override === 'number' && override > 0) return override;
  return SERVICE_DURATIONS[serviceId] ?? 60;
}

export function withServiceConfigOverrides(service, servicesConfig = {}) {
  const durationMinutes = getServiceDurationMinutes(service.id, servicesConfig);
  return {
    ...service,
    durationMinutes,
    durationLabel: formatDuration(durationMinutes),
    price: servicesConfig[service.id]?.priceLabel ?? service.price,
  };
}
