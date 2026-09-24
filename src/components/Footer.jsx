import { CLINICS } from '../constants/clinics';
import OptimizedImage from './OptimizedImage';
import './Footer.css';

const { qro, gdl } = CLINICS;

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo-container">
            <OptimizedImage
              src="/logosin.png"
              alt="Áureo Clinique"
              className="logo-img"
              loading="lazy"
            />
          </a>
          <p>Medicina estética y regenerativa de vanguardia.</p>
        </div>

        <div className="footer-links">
          <h3>Enlaces</h3>
          <ul>
            <li>
              <a href="#servicios">Tratamientos</a>
            </li>
            <li>
              <a href="/WELLNESS.pdf" download="Wellness_Aureo.pdf">
                Wellness (PDF)
              </a>
            </li>
            <li>
              <a href="/REGENERATIVA.pdf" download="Regenerativa_Aureo.pdf">
                Regenerativa (PDF)
              </a>
            </li>
            <li>
              <a href="/ESTETICA.pdf" download="Estetica_Aureo.pdf">
                Estética (PDF)
              </a>
            </li>
            <li>
              <a href="#nosotros">Nosotros</a>
            </li>
          </ul>
        </div>

        <div className="footer-social">
          <h3>Síguenos</h3>
          <div className="social-icons">
            <a href={qro.instagram} target="_blank" rel="noopener noreferrer" title="Instagram Querétaro">
              IG QRO
            </a>
            <a href={gdl.instagram} target="_blank" rel="noopener noreferrer" title="Instagram Zapopan">
              IG GDL
            </a>
            <a href="https://www.facebook.com/share/18m7fLY1NS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
              FB
            </a>
            <a
              href={`https://wa.me/${qro.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique, me gustaría recibir más información sobre sus tratamientos.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Querétaro"
            >
              WA QRO
            </a>
            <a
              href={`https://wa.me/${gdl.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique Zapopan, me gustaría recibir más información sobre sus tratamientos.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Zapopan"
            >
              WA GDL
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom container">
        <p className="copyright">
          &copy; {new Date().getFullYear()} Aureo Clinique. Todos los derechos reservados.
        </p>
        
        <p className="attribution">
          Hecho por <a href="https://d-mkt.com.mx/" target="_blank" rel="noopener noreferrer"><strong>DMKT</strong></a>
        </p>

        <div className="legal-links">
          <a href="#">Aviso de Privacidad</a>
          <a href="#">Términos y Condiciones</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
