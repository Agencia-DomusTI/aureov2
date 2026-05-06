import { useReveal } from '../hooks/useReveal';
import './Contact.css';

const Contact = () => {
  const revealRef = useReveal();

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
              <h3>Guadalajara</h3>
              <p>Dirección sucursal Guadalajara (Av. Principal #123)</p>
            </div>
            <div className="location-item">
              <h3>Querétaro</h3>
              <p>Dirección sucursal Querétaro (Plaza Médica #456)</p>
            </div>
          </div>

          <div className="contact-details">
            <p>
              <strong>Tel:</strong> +52 (33) 1234 5678
            </p>
            <p>
              <strong>Email:</strong> contacto@aureoclinique.com
            </p>
          </div>
        </div>

        <div className="contact-form-container">
          <span className="form-kicker">Formulario</span>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="field-label" htmlFor="nombre">
                Nombre completo
              </label>
              <input id="nombre" type="text" placeholder="Nombre completo" required />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="email">
                Correo electrónico
              </label>
              <input id="email" type="email" placeholder="Correo electrónico" required />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="tel">
                Teléfono
              </label>
              <input id="tel" type="tel" placeholder="Teléfono" required />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="servicio">
                Servicio de interés
              </label>
              <select id="servicio" required>
                <option value="">Selecciona una opción</option>
                <option value="estetica">Medicina Estética</option>
                <option value="regenerativa">Medicina Regenerativa</option>
                <option value="wellness">Medicina Wellness</option>
              </select>
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="mensaje">
                Mensaje (opcional)
              </label>
              <textarea id="mensaje" placeholder="Cuéntanos tu objetivo" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Solicitar información
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
