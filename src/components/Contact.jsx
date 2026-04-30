import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <section className="contact" id="contacto">
      <div className="container contact-container">
        <div className="contact-info">
          <span className="subtitle">Contacto</span>
          <h2>Comienza tu <span>transformación hoy</span></h2>
          <p>Agenda una valoración personalizada y descubre el tratamiento ideal para ti.</p>
          
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
            <p><strong>Tel:</strong> +52 (33) 1234 5678</p>
            <p><strong>Email:</strong> contacto@aureoclinique.com</p>
          </div>
        </div>
        
        <div className="contact-form-container">
          <form className="contact-form">
            <div className="form-group">
              <input type="text" placeholder="Nombre completo" required />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Correo electrónico" required />
            </div>
            <div className="form-group">
              <input type="tel" placeholder="Teléfono" required />
            </div>
            <div className="form-group">
              <select required>
                <option value="">Servicio de interés</option>
                <option value="estetica">Medicina Estética</option>
                <option value="regenerativa">Medicina Regenerativa</option>
                <option value="wellness">Medicina Wellness</option>
              </select>
            </div>
            <div className="form-group">
              <textarea placeholder="Mensaje (opcional)"></textarea>
            </div>
            <button type="submit" className="btn-primary w-full">Solicitar Información</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
