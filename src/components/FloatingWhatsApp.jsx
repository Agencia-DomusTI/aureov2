import { CLINICS } from '../constants/clinics';
import './FloatingWhatsApp.css';

const waHref = `https://wa.me/${CLINICS.qro.phoneWa}?text=${encodeURIComponent('Hola Áureo Clinique, me gustaría recibir más información sobre sus tratamientos.')}`;

const FloatingWhatsApp = () => {
  return (
    <a
      href={waHref}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <img src="/whatsapp.avif" alt="WhatsApp" className="whatsapp-icon" />
    </a>
  );
};

export default FloatingWhatsApp;
