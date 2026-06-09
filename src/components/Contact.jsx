import { CLINICS } from '../constants/clinics';
import BookingCalendar from './BookingCalendar';
import './Contact.css';

const { qro, gdl } = CLINICS;
const gdlWhatsAppHref = `https://wa.me/${gdl.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique Zapopan, me gustaría agendar una valoración.')}`;

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
