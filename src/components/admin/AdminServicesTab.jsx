import { useMemo, useState } from 'react';
import { getAllBookableServices } from '../../utils/bookableServices';

const AdminServicesTab = ({ settings, setSettings, onSave, saveMsg }) => {
  const allServices = useMemo(() => getAllBookableServices(), []);
  const [filter, setFilter] = useState('');

  const servicesConfig = settings?.servicesConfig ?? {};

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = q
      ? allServices.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : allServices;
    const map = new Map();
    list.forEach((s) => {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category).push(s);
    });
    return map;
  }, [allServices, filter]);

  const updateService = (id, patch) => {
    setSettings((prev) => ({
      ...prev,
      servicesConfig: {
        ...prev.servicesConfig,
        [id]: { ...prev.servicesConfig?.[id], ...patch },
      },
    }));
  };

  const getConfig = (service) => {
    const c = servicesConfig[service.id] ?? {};
    return {
      priceLabel: c.priceLabel ?? service.price ?? '',
      active: c.active !== false,
      depositMxn: c.depositMxn ?? '',
    };
  };

  return (
    <div className="adm-services">
      <header className="adm-services__head">
        <div>
          <h2>Precios y servicios</h2>
          <p>Activa o desactiva tratamientos y edita precios visibles en el sitio.</p>
        </div>
        <button type="button" className="btn-primary" onClick={onSave}>Guardar cambios</button>
      </header>
      {saveMsg ? <p className={`admin-toast ${saveMsg.includes('Error') ? 'admin-toast--err' : 'admin-toast--ok'}`}>{saveMsg}</p> : null}

      <input
        type="search"
        className="admin-input adm-services__search"
        placeholder="Buscar servicio…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <p className="adm-muted adm-services__hint">
        Anticipo base: <strong>${settings?.depositAmountMxn ?? 250} MXN</strong> (cambiar en Configuración)
      </p>

      {[...grouped.entries()].map(([category, items]) => (
        <section key={category} className="adm-svc-group">
          <h3>{category}</h3>
          <div className="adm-svc-table">
            {items.map((service) => {
              const cfg = getConfig(service);
              return (
                <div key={service.id} className={`adm-svc-row ${cfg.active ? '' : 'is-off'}`}>
                  <label className="adm-svc-toggle">
                    <input
                      type="checkbox"
                      checked={cfg.active}
                      onChange={(e) => updateService(service.id, { active: e.target.checked })}
                    />
                    <span />
                  </label>
                  <div className="adm-svc-info">
                    <strong>{service.name}</strong>
                    <span>{service.durationLabel}</span>
                  </div>
                  <input
                    className="admin-input adm-svc-price"
                    value={cfg.priceLabel}
                    placeholder="Precio visible"
                    onChange={(e) => updateService(service.id, { priceLabel: e.target.value })}
                  />
                  <input
                    type="number"
                    className="admin-input adm-svc-deposit"
                    placeholder="Anticipo"
                    min="0"
                    value={cfg.depositMxn}
                    onChange={(e) => updateService(service.id, {
                      depositMxn: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default AdminServicesTab;
