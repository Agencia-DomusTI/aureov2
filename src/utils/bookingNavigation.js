/** Navega a la agenda con un servicio preseleccionado (#contacto?servicio=...) */
export function navigateToBooking(serviceName) {
  if (!serviceName) return;

  const encoded = encodeURIComponent(serviceName);
  const hash = `contacto?servicio=${encoded}`;
  const path = `${window.location.pathname}#${hash}`;

  if (window.location.hash !== `#${hash}`) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
