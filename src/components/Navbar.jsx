import { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container container">
        <a href="/" className="logo">
          ÁUREO
          <span>CLINIQUE</span>
        </a>
        
        <div className="nav-links">
          <a href="/WELLNESS.pdf" download="Wellness_Aureo.pdf">Wellness</a>
          <a href="/REGENERATIVA.pdf" download="Regenerativa_Aureo.pdf">Regenerativa</a>
          <a href="/ESTETICA.pdf" download="Estetica_Aureo.pdf">Estética</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto" className="btn-primary">Agendar</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
