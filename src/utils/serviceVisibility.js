/** Por defecto activo; solo oculta si el admin marcó `active: false` */
export function isServiceActive(serviceId, servicesConfig = {}) {
  return servicesConfig[serviceId]?.active !== false;
}

export function filterActiveServices(services, servicesConfig = {}) {
  return services.filter((s) => isServiceActive(s.id, servicesConfig));
}
