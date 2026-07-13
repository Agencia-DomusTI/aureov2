import { CLINICS } from '../constants/clinics';
import BookingCalendar from './BookingCalendar';
import './Contact.css';

const { qro, gdl } = CLINICS;
const qroWhatsAppHref = `https://wa.me/${qro.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique Querétaro, me gustaría agendar una valoración.')}`;
const gdlWhatsAppHref = `https://wa.me/${gdl.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique Zapopan, me gustaría agendar una valoración.')}`;

function PhoneIcon() {
  return (
    <svg className="location-action__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.4 21 3 13.6 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="location-action__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35ZM12.04 2C6.5 2 2 6.5 2 12.05c0 1.78.46 3.45 1.28 4.92L2 22l5.17-1.35A9.98 9.98 0 0 0 12.05 22C17.55 22 22 17.5 22 12S17.55 2 12.04 2Zm0 18.15a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.8.82-3-.19-.31a8.15 8.15 0 1 1 6.87 3.82Z"
      />
    </svg>
  );
}

const Contact = () => {
  return (
    <section className="contact" id="contacto">
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
              <div className="location-actions">
                <a className="location-action location-action--call" href={`tel:${qro.phoneTel}`}>
                  <PhoneIcon />
                  <span>
                    <strong>Llamar</strong>
                    {qro.phone}
                  </span>
                </a>
                <a
                  className="location-action location-action--wa"
                  href={qroWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  <span>
                    <strong>WhatsApp</strong>
                    {qro.phoneWaDisplay}
                  </span>
                </a>
              </div>
            </div>
            <div className="location-item">
              <h3>{gdl.label}</h3>
              <p>{gdl.address}</p>
              <div className="location-actions">
                <a className="location-action location-action--call" href={`tel:${gdl.phoneTel}`}>
                  <PhoneIcon />
                  <span>
                    <strong>Llamar</strong>
                    {gdl.phone}
                  </span>
                </a>
                <a
                  className="location-action location-action--wa"
                  href={gdlWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  <span>
                    <strong>WhatsApp</strong>
                    {gdl.phoneWaDisplay}
                  </span>
                </a>
              </div>
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
              El calendario en línea es para Querétaro. Para Zapopan, Jalisco, agenda por WhatsApp o
              en el calendario del doctor.
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
          <BookingCalendar />
        </div>
      </div>
    </section>
  );
};

export default Contact;
