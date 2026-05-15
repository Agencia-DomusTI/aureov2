import { useReveal } from '../hooks/useReveal';
import OptimizedImage from './OptimizedImage';
import './About.css';

const About = () => {
  const revealRef = useReveal();

  return (
    <section className="about scroll-reveal" id="nosotros" ref={revealRef}>
      <div className="container about-grid">
        <div className="about-image">
          <OptimizedImage
            src="/doctor_official.png"
            alt="Dr. Demetrio Quintero Mármol Cisneros"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 45vw"
            width={691}
            height={813}
          />
          <div className="experience-badge">
            <span>+11</span>
            <p>
              Años de <br />
              experiencia
            </p>
          </div>
        </div>

        <div className="about-text">
          <span className="subtitle about-eyebrow">¿Quiénes somos?</span>
          <h2>
            Salud, belleza y <br />
            <span>bienestar integral</span>
          </h2>

          <div className="content-blocks">
            <p>
              En <strong>Aureo Clinique</strong> promovemos la salud, la belleza y el bienestar integral
              a través de tratamientos médicos seguros, personalizados y basados en evidencia.
            </p>
            <p>
              Nuestra filosofía combina la ciencia estética con un enfoque natural y armónico,
              logrando resultados visibles que respetan y realzan la esencia de cada persona.
            </p>
            <p>
              Nacidos en <strong>Guadalajara</strong> y ahora también en <strong>Querétaro</strong>,
              ofrecemos atención médica de vanguardia, acompañamiento cercano y resultados sutiles,
              equilibrados y naturales.
            </p>
            <div className="founder-info">
              <p>
                Fundada por el <strong>Dr. Demetrio Quintero Mármol Cisneros</strong>, con más de 11 años
                de experiencia en medicina estética y regenerativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
