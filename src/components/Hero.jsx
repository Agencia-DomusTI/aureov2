import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-eyebrow animate-fade">Medicina estética · regenerativa · wellness</p>
        <h1 className="hero-title animate-fade" style={{ animationDelay: '0.08s' }}>
          La ciencia de la belleza <br />
          <span>en armonía.</span>
        </h1>
        <p className="hero-lead animate-fade" style={{ animationDelay: '0.2s' }}>
          En Aureo Clinique promovemos la salud y el bienestar integral a través de tratamientos
          médicos seguros y personalizados.
        </p>
        <div className="hero-btns animate-fade" style={{ animationDelay: '0.32s' }}>
          <a href="#contacto" className="btn-primary">
            Agendar valoración <span className="hero-arrow">→</span>
          </a>
          <a href="#servicios" className="btn-secondary hero-btn-outline">
            Ver tratamientos <span className="hero-arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
