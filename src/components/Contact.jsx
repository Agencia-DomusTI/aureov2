import { useEffect } from 'react';
import { CLINICS } from '../constants/clinics';
import { useReveal } from '../hooks/useReveal';
import './Contact.css';

const LEAD_EMBED_SCRIPT_SRC = 'https://api.lead.dcontrol.com.mx/js/form_embed.js';
const SERVICE_MENU_IFRAME_ID = '6a077883e531247aa622aa62_1778874522721';
const SERVICE_MENU_IFRAME_SRC =
  'https://api.lead.dcontrol.com.mx/widget/service-menu/6a077883e531247aa622aa62';

const { qro, gdl } = CLINICS;
const gdlWhatsAppHref = `https://wa.me/${gdl.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique Zapopan, me gustaría agendar una valoración.')}`;

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
            Agenda una valoración personalizada y descubre el tratamiento ideal para ti en nuestras
            sucursales de Querétaro y Zapopan.
          </p>

          <div className="locations">
            <div className="location-item">
              <h3>{qro.label}</h3>
              <p>{qro.address}</p>
              <p className="location-phone">
                <strong>Tel:</strong>{' '}
                <a href={`tel:${qro.phone.replace(/\s/g, '')}`}>{qro.phone}</a>
              </p>
            </div>
            <div className="location-item">
              <h3>{gdl.label}</h3>
              <p>{gdl.address}</p>
              <p className="location-phone">
                <strong>Tel:</strong>{' '}
                <a href={`tel:${gdl.phone.replace(/\s/g, '')}`}>{gdl.phone}</a>
              </p>
              <p className="location-social">
                <a href={gdl.instagram} target="_blank" rel="noopener noreferrer">
                  @aureoclinique_gdl
                </a>
              </p>
            </div>
          </div>

          <div className="contact-details">
            <p>
              <strong>Email:</strong> {qro.email}
            </p>
          </div>

          <div className="contact-gdl-booking">
            <h3>¿Prefieres agendar en Zapopan?</h3>
            <p>
              Las citas en línea de este sitio son exclusivamente para Querétaro. Para Zapopan, Jalisco,
              agenda por WhatsApp o en el calendario del doctor.
            </p>
            <div className="contact-gdl-actions">
              {gdl.googleCalendarUrl ? (
                <a
                  href={gdl.googleCalendarUrl}
                  className="btn-primary contact-gdl-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agendar en Zapopan
                </a>
              ) : null}
              <a
                href={gdlWhatsAppHref}
                className={`btn-secondary contact-gdl-btn${gdl.googleCalendarUrl ? '' : ' contact-gdl-btn--solo'}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Zapopan
              </a>
            </div>
          </div>
        </div>

        <div className="contact-form-container contact-booking-wrap">
          <span className="form-kicker">Agenda en Querétaro</span>
          <p className="contact-booking-notice">
            El calendario y pago en línea a continuación aplican <strong>solo para Querétaro</strong>.
          </p>
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
