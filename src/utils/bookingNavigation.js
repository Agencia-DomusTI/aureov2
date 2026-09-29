/** Lleva al calendario de Doctoralia en la sección de contacto (#agenda). */
export function navigateToBooking() {
  if (window.location.hash !== '#agenda') {
    window.history.pushState(null, '', `${window.location.pathname}#agenda`);
  }

  document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
