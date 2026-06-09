import { useMemo, useState } from 'react';
import { getAllBookableServices } from '../../utils/bookableServices';

const AdminServicesTab = ({ settings, setSettings, onSave, saveMsg }) => {
  const allServices = useMemo(() => getAllBookableServices(), []);
  const [filter, setFilter] = useState('');

  const servicesConfig = settings?.servicesConfig ?? {};

  const categories = useMemo(() => {
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

  const activeCount = useMemo(() => {
    return allServices.filter((s) => {
      const cfg = servicesConfig[s.id];
      return cfg?.active !== false;
    }).length;
  }, [allServices, servicesConfig]);

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
    <div className="adm-svc-apple">
      <header className="adm-svc-apple__head">
        <div>
          <h2>Servicios</h2>
          <p>{activeCount} activos en reservas en línea</p>
        </div>
        <button type="button" className="adm-svc-apple__save" onClick={onSave}>
          Guardar cambios
        </button>
      </header>

      {saveMsg ? (
        <p className={`admin-toast ${saveMsg.includes('Error') ? 'admin-toast--err' : 'admin-toast--ok'}`}>
          {saveMsg}
        </p>
      ) : null}

      <div className="adm-svc-apple__toolbar">
        <input
          type="search"
          className="adm-svc-apple__search"
          placeholder="Buscar tratamiento…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="adm-svc-apple__banner">
          Anticipo base <strong>${settings?.depositAmountMxn ?? 250} MXN</strong>
        </div>
      </div>

      <div className="adm-svc-apple__list">
        {[...categories.entries()].map(([category, items]) => (
          <section key={category} className="adm-svc-apple__section">
            <h3>{category}</h3>
            <div className="adm-svc-apple__table">
              <div className="adm-svc-apple__thead" aria-hidden>
                <span>Estado</span>
                <span>Tratamiento</span>
                <span>Precio</span>
                <span>Anticipo</span>
              </div>
              <div className="adm-svc-apple__group">
                {items.map((service) => {
                  const cfg = getConfig(service);
                  return (
                    <div
                      key={service.id}
                      className={`adm-svc-apple__row ${cfg.active ? '' : 'is-off'}`}
                    >
                      <label className="adm-ios-toggle" title={cfg.active ? 'Activo' : 'Inactivo'}>
                        <input
                          type="checkbox"
                          checked={cfg.active}
                          onChange={(e) => updateService(service.id, { active: e.target.checked })}
                        />
                        <span />
                      </label>
                      <div className="adm-svc-apple__text">
                        <strong>{service.name}</strong>
                        <span>{service.durationLabel}</span>
                        <span className={`adm-svc-apple__status ${cfg.active ? 'is-on' : 'is-off'}`}>
                          {cfg.active ? 'Visible en web' : 'Oculto'}
                        </span>
                      </div>
                      <label className="adm-svc-apple__field">
                        <span className="adm-svc-apple__field-label">Precio</span>
                        <input
                          className="adm-svc-apple__input"
                          value={cfg.priceLabel}
                          placeholder="Precio visible"
                          onChange={(e) => updateService(service.id, { priceLabel: e.target.value })}
                        />
                      </label>
                      <label className="adm-svc-apple__field adm-svc-apple__field--deposit">
                        <span className="adm-svc-apple__field-label">Anticipo</span>
                        <div className="adm-svc-apple__deposit-wrap">
                          <span className="adm-svc-apple__currency">$</span>
                          <input
                            type="number"
                            className="adm-svc-apple__input adm-svc-apple__input--deposit"
                            placeholder="250"
                            min="0"
                            value={cfg.depositMxn}
                            onChange={(e) => updateService(service.id, {
                              depositMxn: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            })}
                          />
                          <span className="adm-svc-apple__currency">MXN</span>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        {!categories.size ? (
          <p className="adm-apple-empty">No hay servicios que coincidan con tu búsqueda</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminServicesTab;
