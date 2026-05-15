import { useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import './Contact.css';

const LEAD_EMBED_SCRIPT_SRC = 'https://api.lead.dcontrol.com.mx/js/form_embed.js';
const SERVICE_MENU_IFRAME_ID = '6a077883e531247aa622aa62_1778874522721';
const SERVICE_MENU_IFRAME_SRC =
  'https://api.lead.dcontrol.com.mx/widget/service-menu/6a077883e531247aa622aa62';

const Contact = () => {
  const revealRef = useReveal();

  useEffect(() => {
    if (document.querySelector(`script[src="${LEAD_EMBED_SCRIPT_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = LEAD_EMBED_SCRIPT_SRC;
    script.type = 'text/javascript';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section className="contact scroll-reveal" id="contacto" ref={revealRef}>
      <div className="container contact-container">
        <div className="contact-info">
          <span className="subtitle">Contacto</span>
          <h2>
            Comienza tu <span>transformación hoy</span>
          </h2>
          <p className="contact-lead">
            Agenda una valoración personalizada y descubre el tratamiento ideal para ti.
          </p>

          <div className="locations">
            <div className="location-item">
              <h3>Ubicación</h3>
              <p>
                Av. Paseo de las Pitahayas No. 55, Local 217, Plaza Xentric Anáhuac, Zibatá, El Marqués,
                Querétaro
              </p>
            </div>
          </div>

          <div className="contact-details">
            <p>
              <strong>Tel:</strong> +52 442 721 7377
            </p>
            <p>
              <strong>Email:</strong> aureoqro@gmail.com
            </p>
          </div>
        </div>

        <div className="contact-form-container contact-booking-wrap">
          <span className="form-kicker">Tratamientos y servicios</span>
          <div className="contact-booking-frame">
            <iframe
              src={SERVICE_MENU_IFRAME_SRC}
              title="Menú de servicios — Áureo Clinique"
              id={SERVICE_MENU_IFRAME_ID}
              scrolling="no"
              className="contact-booking-iframe"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
