import { useEffect, useRef } from 'react';

const DOCTOR_SLUG = 'demetrio-quintero-marmol-cisneros';
const PROFILE_URL = `https://www.doctoralia.com.mx/perfil/${DOCTOR_SLUG}`;
const SCRIPT_ID = 'zl-widget-s';
const SCRIPT_SRC = 'https://platform.docplanner.com/js/widget.js';

/**
 * Calendario de citas de Doctoralia (iframe inyectado por su widget.js).
 * El <a> se crea fuera de React porque el script lo reemplaza por el iframe.
 */
const DoctoraliaWidget = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const link = document.createElement('a');
    link.id = 'zl-url';
    link.className = 'zl-url';
    link.href = PROFILE_URL;
    link.rel = 'nofollow';
    link.textContent = 'Reserve una cita';
    Object.assign(link.dataset, {
      zlwDoctor: DOCTOR_SLUG,
      zlwType: 'big_with_calendar',
      zlwOpinion: 'false',
      zlwHideBranding: 'true',
      zlwSaasOnly: 'true',
      zlwA11yTitle: 'Widget de reserva de citas médicas',
    });
    container.replaceChildren(link);

    // El script solo escanea la página al cargarse: se reinyecta en cada montaje.
    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, []);

  return <div className="doctoralia-widget" ref={containerRef} />;
};

export default DoctoraliaWidget;
