import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content container">
        <h1 className="animate-fade">La ciencia de la belleza <br /><span>en armonía.</span></h1>
        <p className="animate-fade" style={{ animationDelay: '0.2s' }}>
          En Aureo Clinique promovemos la salud y el bienestar integral <br />
          a través de tratamientos médicos seguros y personalizados.
        </p>
        <div className="hero-btns animate-fade" style={{ animationDelay: '0.4s' }}>
          <a href="#contacto" className="btn-primary">Descubre tu potencial</a>
          <a href="#wellness" className="btn-secondary">Nuestros servicios</a>
        </div>
      </div>
      <div className="hero-overlay"></div>
    </section>
  );
};

export default Hero;
