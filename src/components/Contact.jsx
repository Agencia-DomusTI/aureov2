import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import './Contact.css';

const Contact = () => {
  const revealRef = useReveal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState({ value: '', label: 'Selecciona una opción' });

  const services = [
    { value: 'estetica', label: 'Medicina Estética' },
    { value: 'regenerativa', label: 'Medicina Regenerativa' },
    { value: 'wellness', label: 'Medicina Wellness' },
  ];

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
              <p>Av. Paseo de las Pitahayas No. 55, Local 217, Plaza Xentric Anáhuac, Zibatá, El Marqués, Querétaro</p>
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

        <div className="contact-form-container">
          <span className="form-kicker">Formulario</span>
          <form 
            className="contact-form" 
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.nombre.value;
              const email = e.target.email.value;
              const edad = e.target.edad.value;
              
              if (!selectedService.value) {
                alert('Por favor selecciona un servicio');
                return;
              }
              
              const message = `Hola Áureo Clinique, mi nombre es ${name}, tengo ${edad} años, mi correo es ${email} y estoy interesado en el servicio de ${selectedService.label}.`;
              const encodedMessage = encodeURIComponent(message);
              window.open(`https://wa.me/524427217377?text=${encodedMessage}`, '_blank');
            }}
          >
            <div className="form-group">
              <label className="field-label" htmlFor="nombre">
                Nombre completo
              </label>
              <input id="nombre" name="nombre" type="text" placeholder="Nombre completo" required />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="email">
                Correo electrónico
              </label>
              <input id="email" name="email" type="email" placeholder="Correo electrónico" required />
            </div>
            <div className="form-group">
              <label className="field-label" htmlFor="edad">
                Edad
              </label>
              <input id="edad" name="edad" type="number" placeholder="Tu edad" required />
            </div>
            <div className="form-group">
              <label className="field-label">
                Servicio de interés
              </label>
              <div className={`custom-dropdown ${isDropdownOpen ? 'is-open' : ''}`}>
                <div 
                  className="dropdown-trigger" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{selectedService.label}</span>
                  <span className="dropdown-arrow"></span>
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {services.map((service) => (
                      <div 
                        key={service.value} 
                        className={`dropdown-option ${selectedService.value === service.value ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedService(service);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {service.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
