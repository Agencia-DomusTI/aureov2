import { useEffect, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';
import './ParallaxBand.css';

const PARALLAX_BG_URL = '/multimedia/fondo3.jpg';

/** 0 → fondo igual que el bloque · ~0.5 → sensación muy clara · ~1 casi pegado al viewport */
const SPEED = 0.45;

export default function ParallaxBand() {
  const sectionRef = useRef(null);
  const contentRevealRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="parallax-band"
      aria-labelledby="parallax-band-heading"
    >
      <div
        className="parallax-band__bg"
        style={{ backgroundImage: `url(${PARALLAX_BG_URL})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="parallax-band__veil" aria-hidden="true" />
      <div
        ref={contentRevealRef}
        className="parallax-band__inner container scroll-reveal"
      >
        <p className="parallax-band__eyebrow">Esencia Áureo</p>
        <h2 id="parallax-band-heading" className="parallax-band__title">
          No transformamos. <em>Revelamos</em> la proporción que ya es tuya.
        </h2>
        <p className="parallax-band__lead">
          Salud interna que se refleja afuera. Medicina basada en evidencia, resultados naturales y
          acompañamiento médico cercano — en cada sesión y en cada plan.
        </p>
      </div>
    </section>
  );
}
