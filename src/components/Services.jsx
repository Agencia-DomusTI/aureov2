import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import './Services.css';

const servicesData = {
  wellness: {
    title: 'Medicina Wellness',
    items: [
      {
        name: 'Presoterapia',
        desc: 'Tratamiento médico y estético que utiliza la presión de aire para realizar un drenaje linfático. Mejora la circulación, reduce la retención de líquidos y ayuda a eliminar toxinas.',
        img: '/multimedia/a.jpg',
      },
      {
        name: 'Facial Médico',
        desc: 'Limpieza profunda de grado médico que exfolia y renueva las capas superficiales de la piel, extrayendo impurezas y nutriendo con sueros especializados.',
        img: '/multimedia/b.jpg',
      },
      {
        name: 'Hidrafacial',
        desc: 'Tecnología patentada Vortex-Fusion que limpia, extrae e hidrata. Resultados inmediatos de luminosidad y revitalización sin tiempo de recuperación.',
        img: '/multimedia/c.jpg',
      },
      {
        name: 'Criolipólisis',
        desc: 'Procedimiento no invasivo que elimina grasa localizada mediante la aplicación controlada de frío, destruyendo las células grasas de forma natural.',
        img: '/multimedia/d.jpg',
      },
      {
        name: 'Cámara Hiperbárica',
        desc: 'Oxigenoterapia al 100% en ambiente presurizado. Acelera la cicatrización, regenera tejidos y potencia los resultados de cualquier tratamiento médico.',
        img: '/multimedia/e.jpg',
      },
      {
        name: 'Radiofrecuencia Fraccionada',
        desc: 'Estimula la producción de colágeno y elastina mediante calor profundo. Ideal para tensar la piel, tratar cicatrices y mejorar la textura general.',
        img: '/multimedia/f.jpg',
      },
      {
        name: 'Ultrasonido Focalizado (HIFU)',
        desc: 'Lifting sin cirugía que utiliza ondas de ultrasonido para elevar y tensar el rostro, cuello y escote, trabajando en las capas profundas de la piel.',
        img: '/multimedia/g.jpg',
      },
      {
        name: 'Electromagnetismo (HIFEM)',
        desc: 'Tecnología que induce contracciones musculares supra-máximas. Ideal para tonificar músculos y quemar grasa de forma simultánea.',
        img: '/multimedia/h.jpg',
      },
      {
        name: 'Morpheus',
        desc: 'Radiofrecuencia fraccionada con microagujas que remodela el tejido subdérmico. El estándar de oro para flacidez severa y rejuvenecimiento profundo.',
        img: '/multimedia/i.jpg',
      },
    ],
  },
  regenerativa: {
    title: 'Medicina Regenerativa',
    items: [
      {
        name: 'Sueroterapia',
        desc: 'Infusión intravenosa de vitaminas y minerales para optimizar la salud celular.',
        img: '/multimedia/j.jpg',
      },
      {
        name: 'Células Madre',
        desc: 'Terapia celular avanzada para regenerar tejidos y potenciar la longevidad.',
        img: '/multimedia/k.jpg',
      },
      {
        name: 'Exosomas',
        desc: 'Vesículas extracelulares que actúan como mensajeros celulares para la reparación profunda.',
        img: '/multimedia/l.jpg',
      },
      {
        name: 'Ozonoterapia',
        desc: 'Tratamiento sistémico con ozono médico para mejorar la oxigenación y el sistema inmune.',
        img: '/multimedia/m.jpg',
      },
    ],
  },
  estetica: {
    title: 'Medicina Estética',
    items: [
      {
        name: 'Toxina Botulínica',
        desc: 'Suaviza arrugas de expresión para un aspecto descansado y natural.',
        img: '/multimedia/c.jpg',
      },
      {
        name: 'Rellenos (Fillers)',
        desc: 'Ácido hialurónico para restaurar volúmenes y redefinir contornos faciales.',
        img: '/multimedia/d.jpg',
      },
      {
        name: 'Hilos Tensores',
        desc: 'Lifting mecánico inmediato y estimulación de colágeno a largo plazo.',
        img: '/multimedia/e.jpg',
      },
      {
        name: 'Bioestimuladores',
        desc: 'Tratamientos inyectables que activan la producción natural de colágeno propio.',
        img: '/multimedia/f.jpg',
      },
    ],
  },
};

/** Ítems en vista previa tipo collage antes de “Ver más” */
const PREVIEW_COUNT = 6;

function collageModifier(indexInList, expanded) {
  if (indexInList >= PREVIEW_COUNT && expanded) return 'service-card--rest';
  return `service-card--c${Math.min(indexInList, PREVIEW_COUNT - 1) + 1}`;
}

const Services = () => {
  const revealRef = useReveal();
  const [activeTab, setActiveTab] = useState('wellness');
  const [selectedService, setSelectedService] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const items = servicesData[activeTab].items;
  const hasMore = items.length > PREVIEW_COUNT;
  const visibleItems = expanded || !hasMore ? items : items.slice(0, PREVIEW_COUNT);
  const remaining = Math.max(0, items.length - PREVIEW_COUNT);

  return (
    <section className="services scroll-reveal" id="servicios" ref={revealRef}>
      <div className="container">
        <div className="services-header">
          <span className="subtitle">Nuestros tratamientos</span>
          <h2>
            Excelencia en <span>medicina especializada</span>
          </h2>
          <p className="services-deck">
            Collage editorial por categoría · PDF descargables en el menú superior
          </p>
        </div>

        <div className="services-tabs">
          {Object.keys(servicesData).map((key) => (
            <button
              key={key}
              type="button"
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(key);
                setExpanded(false);
              }}
            >
              {servicesData[key].title}
            </button>
          ))}
        </div>

        <div
          className={`services-collage ${expanded ? 'services-collage--expanded' : ''} ${
            items.length <= PREVIEW_COUNT ? 'services-collage--few' : ''
          }`}
          key={activeTab}
        >
          {visibleItems.map((service, index) => (
            <div
              key={`${activeTab}-${service.name}-${index}`}
              className={`service-card service-card--collage ${collageModifier(index, expanded)}`}
              onClick={() => setSelectedService(service)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedService(service);
              }}
            >
              <div className="card-image">
                <img src={service.img} alt="" decoding="async" />
              </div>
              <div className="card-content card-content--collage">
                <span className="service-number">{(index + 1).toString().padStart(2, '0')}</span>
                <h3>{service.name}</h3>
                <span className="learn-more">
                  Detalle <span className="learn-arrow">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="services-expand-wrap">
            <button
              type="button"
              className={`services-expand-btn ${expanded ? 'is-expanded' : ''}`}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Mostrar menos' : `Ver más · ${remaining} tratamiento${remaining === 1 ? '' : 's'}`}</span>
              <span className="services-expand-btn__arrow" aria-hidden="true">
                {expanded ? '↑' : '↓'}
              </span>
            </button>
          </div>
        )}
      </div>

      {selectedService && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setSelectedService(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-modal" onClick={() => setSelectedService(null)}>
              ×
            </button>
            <div className="modal-grid">
              <div className="modal-image">
                <img src={selectedService.img} alt="" />
              </div>
              <div className="modal-text">
                <span className="subtitle">{servicesData[activeTab].title}</span>
                <h2 id="modal-title">{selectedService.name}</h2>
                <p>{selectedService.desc}</p>
                <a
                  href="#contacto"
                  className="btn-primary"
                  onClick={() => setSelectedService(null)}
                >
                  Agendar valoración
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
