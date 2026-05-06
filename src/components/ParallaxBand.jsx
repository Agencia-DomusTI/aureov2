import { useEffect, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';
import './ParallaxBand.css';

const PARALLAX_BG_URL =
  'https://drive.dcontrol.com.mx/api/links/839cbe1588ca2921a65055d5d03063d7/raw';

/** 0 → fondo igual que el bloque · ~0.5 → sensación muy clara · ~1 casi pegado al viewport */
const SPEED = 0.45;

export default function ParallaxBand() {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const contentRevealRef = useReveal();

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => {
      if (reduce.matches) {
        bg.style.transform = '';
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.bottom <= 0 || rect.top >= vh) return;

      /* La sección se mueve a velocidad 1 por el viewport; movemos la foto más despacio dentro
       * del hueco (= queda atrás respecto al texto y las secciones vecinas).
       */
      const yOffset = -(rect.top * SPEED);
      bg.style.transform = `translate3d(0, ${yOffset}px, 0) scale(1.12)`;
    };

    update();
    const onScroll = () => window.requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    reduce.addEventListener('change', update);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="parallax-band"
      aria-labelledby="parallax-band-heading"
    >
      <div
        ref={bgRef}
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
