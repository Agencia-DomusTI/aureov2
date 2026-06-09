import { useMemo } from 'react';
import { servicesData } from '../constants/services';
import { useServicesConfig } from '../hooks/useServicesConfig';
import { isServiceActive } from '../utils/serviceVisibility';
import './Ticker.css';

const FALLBACK_ITEMS = [
  'Valoración médica',
  'Medicina estética',
  'Medicina regenerativa',
];

function tickerLabel(name) {
  const short = name.split('(')[0].trim();
  return short.length > 32 ? `${short.slice(0, 30)}…` : short;
}

const Ticker = () => {
  const { servicesConfig } = useServicesConfig();

  const items = useMemo(() => {
    const names = [];

    if (isServiceActive('Valoración médica', servicesConfig)) {
      names.push('Valoración médica');
    }

    Object.values(servicesData).forEach((category) => {
      category.items.forEach((item) => {
        if (isServiceActive(item.name, servicesConfig)) {
          names.push(tickerLabel(item.name));
        }
      });
    });

    const unique = [...new Set(names)];
    return unique.length >= 3 ? unique : FALLBACK_ITEMS;
  }, [servicesConfig]);

  const doubled = [...items, ...items];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((label, i) => (
          <span key={`${label}-${i}`} className="ticker-item">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
