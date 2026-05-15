import { useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import './Contact.css';

const BOOKING_EMBED_SRC = 'https://api.lead.dcontrol.com.mx/js/form_embed.js';
const BOOKING_IFRAME_ID = 'FBFdUr657QzD68aAR4sf_1778872754156';
const BOOKING_IFRAME_SRC =
  'https://api.lead.dcontrol.com.mx/widget/booking/FBFdUr657QzD68aAR4sf';

const Contact = () => {
  const revealRef = useReveal();

  useEffect(() => {
    if (document.querySelector(`script[src="${BOOKING_EMBED_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = BOOKING_EMBED_SRC;
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
          <span className="form-kicker">Agenda en línea</span>
          <div className="contact-booking-frame">
            <iframe
              src={BOOKING_IFRAME_SRC}
              title="Reservar cita — Áureo Clinique"
              id={BOOKING_IFRAME_ID}
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
