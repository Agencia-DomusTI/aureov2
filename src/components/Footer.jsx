import OptimizedImage from './OptimizedImage';
import './Footer.css';

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
              width={200}
              height={60}
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
              <a href="/WELLNESS.pdf" download>
                Wellness (PDF)
              </a>
            </li>
            <li>
              <a href="/REGENERATIVA.pdf" download>
                Regenerativa (PDF)
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
            <a href="https://www.instagram.com/aureoclinique_qro?igsh=MTRtbmVnbmNxNXJyZw==" target="_blank" rel="noopener noreferrer">IG</a>
            <a href="https://www.facebook.com/share/18m7fLY1NS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">FB</a>
            <a href="https://wa.me/524427217377?text=Hola%20%C3%81ureo%20Clinique%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20tratamientos." target="_blank" rel="noopener noreferrer">WA</a>
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
