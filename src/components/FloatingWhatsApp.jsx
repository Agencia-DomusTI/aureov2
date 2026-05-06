import './FloatingWhatsApp.css';

const FloatingWhatsApp = () => {
  return (
    <a
      href="https://wa.me/524427217377?text=Hola%20%C3%81ureo%20Clinique%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20tratamientos."
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
