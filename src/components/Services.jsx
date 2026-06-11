import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SERVICE_DURATIONS, formatDuration } from '../constants/booking';
import { SERVICE_PROMOTIONS, servicesData } from '../constants/services';
import { useServicesConfig } from '../hooks/useServicesConfig';
import { navigateToBooking } from '../utils/bookingNavigation';
import { isServiceActive } from '../utils/serviceVisibility';
import OptimizedImage from './OptimizedImage';
import './Services.css';

/** Ítems en vista previa tipo collage antes de “Ver más” */
const PREVIEW_COUNT = 6;

function collageModifier(indexInList, expanded) {
  if (indexInList >= PREVIEW_COUNT && expanded) return 'service-card--rest';
  return `service-card--c${Math.min(indexInList, PREVIEW_COUNT - 1) + 1}`;
}

const Services = () => {
  const [activeTab, setActiveTab] = useState('estetica');
  const [selectedService, setSelectedService] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const { servicesConfig } = useServicesConfig();

  const visibleTabs = useMemo(() => {
    return Object.entries(servicesData).filter(([, category]) =>
      category.items.some((item) => isServiceActive(item.name, servicesConfig)),
    );
  }, [servicesConfig]);

  const items = useMemo(() => {
    const category = servicesData[activeTab];
    if (!category) return [];
    return category.items.filter((item) => isServiceActive(item.name, servicesConfig));
  }, [activeTab, servicesConfig]);

  useEffect(() => {
    if (!visibleTabs.some(([key]) => key === activeTab) && visibleTabs[0]) {
      setActiveTab(visibleTabs[0][0]);
    }
  }, [visibleTabs, activeTab]);
  const hasMore = items.length > PREVIEW_COUNT;
  const visibleItems = expanded || !hasMore ? items : items.slice(0, PREVIEW_COUNT);
  const remaining = Math.max(0, items.length - PREVIEW_COUNT);

  return (
    <section className="services" id="servicios">
      <div className="container">
        <div className="services-header">
          <span className="subtitle">Nuestros tratamientos</span>
          <h2>
            Excelencia en <span>medicina especializada</span>
          </h2>
          <p className="services-deck">
            Catálogo Aureo Clinique Querétaro · Valoración médica previa
          </p>
        </div>

        <div className="services-tabs">
          {visibleTabs.map(([key]) => (
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
            !expanded && items.length > 0 && items.length <= PREVIEW_COUNT
              ? `services-collage--count-${items.length}`
              : ''
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
                <OptimizedImage
                  src={service.img}
                  alt={service.name}
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 280px"
                />
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
              <span>
                {expanded ? 'Mostrar menos' : `Ver más · ${remaining} tratamiento${remaining === 1 ? '' : 's'}`}
              </span>
              <span className="services-expand-btn__arrow" aria-hidden="true">
                {expanded ? '↑' : '↓'}
              </span>
            </button>
          </div>
        )}

        <div className="services-promos">
          <span className="services-promos__label">Promociones vigentes</span>
          <ul className="services-promos__list">
            {SERVICE_PROMOTIONS.map((item) => (
              <li key={item.product}>
                <strong>{item.product}</strong>
                <span>{item.promo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedService &&
        createPortal(
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
                  <OptimizedImage
                    src={selectedService.img}
                    alt={selectedService.name}
                    loading="eager"
                    sizes="(max-width: 768px) 100vw, 480px"
                  />
                </div>
                <div className="modal-text">
                  <span className="subtitle">{servicesData[activeTab]?.title}</span>
                  <h2 id="modal-title">{selectedService.name}</h2>
                  {SERVICE_DURATIONS[selectedService.name] ? (
                    <p className="modal-duration">
                      Duración: {formatDuration(SERVICE_DURATIONS[selectedService.name])}
                    </p>
                  ) : null}
                  <p>{selectedService.desc}</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const name = selectedService.name;
                      setSelectedService(null);
                      navigateToBooking(name);
                    }}
                  >
                    Agendar valoración
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};

export default Services;
