import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo">
            ÁUREO
            <span>CLINIQUE</span>
          </a>
          <p>Medicina estética y regenerativa de vanguardia.</p>
        </div>
        
        <div className="footer-links">
          <h3>Enlaces</h3>
          <ul>
            <li><a href="#wellness">Wellness</a></li>
            <li><a href="#regenerativa">Regenerativa</a></li>
            <li><a href="#estetica">Estética</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
          </ul>
        </div>
        
        <div className="footer-social">
          <h3>Síguenos</h3>
          <div className="social-icons">
            <a href="#">IG</a>
            <a href="#">FB</a>
            <a href="#">WA</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom container">
        <p>&copy; {new Date().getFullYear()} Aureo Clinique. Todos los derechos reservados.</p>
        <div className="legal-links">
          <a href="#">Aviso de Privacidad</a>
          <a href="#">Términos y Condiciones</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
