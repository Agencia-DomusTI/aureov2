import './Ticker.css';

const ITEMS = [
  'Células madre mesenquimales',
  'Pico láser',
  'NAD+',
  'Exosomas',
  'Ozonoterapia',
  'Sueroterapia IV',
  'Bioestimuladores',
  'Criolipólisis ICE PRO',
];

const Ticker = () => {
  const doubled = [...ITEMS, ...ITEMS];
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
