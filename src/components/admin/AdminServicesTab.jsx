import { useMemo, useState } from 'react';
import { formatDuration } from '../../constants/booking';
import { getAllBookableServices } from '../../utils/bookableServices';
import { getServiceDurationMinutes } from '../../utils/serviceConfig';

const AdminServicesTab = ({ settings, setSettings, onSave, saveMsg }) => {
  const allServices = useMemo(() => getAllBookableServices(), []);
  const [filter, setFilter] = useState('');

  const servicesConfig = settings?.servicesConfig ?? {};
  const baseDeposit = settings?.depositAmountMxn ?? 250;

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
    return allServices.filter((s) => servicesConfig[s.id]?.active !== false).length;
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
    const durationMinutes = getServiceDurationMinutes(service.id, servicesConfig);
    return {
      priceLabel: c.priceLabel ?? service.price ?? '',
      active: c.active !== false,
      depositMxn: c.depositMxn ?? '',
      durationMinutes,
    };
  };

  const getCategoryState = (items) => {
    const active = items.filter((s) => getConfig(s).active).length;
    if (active === 0) return 'off';
    if (active === items.length) return 'on';
    return 'mixed';
  };

  const setCategoryActive = (items, active) => {
    setSettings((prev) => {
      const next = { ...prev.servicesConfig };
      items.forEach((s) => {
        next[s.id] = { ...next[s.id], active };
      });
      return { ...prev, servicesConfig: next };
    });
  };

  return (
    <div className="adm-svc-apple">
      <header className="adm-svc-apple__head">
        <div>
          <h2>Servicios</h2>
          <p>{activeCount} de {allServices.length} activos en reservas en línea</p>
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
        <label className="adm-svc-apple__base-deposit">
          <span className="adm-svc-apple__base-deposit-label">Anticipo base</span>
          <div className="adm-svc-apple__deposit-wrap">
            <span className="adm-svc-apple__currency">$</span>
            <input
              type="number"
              className="adm-svc-apple__input adm-svc-apple__input--deposit"
              min="0"
              step="50"
              placeholder="250"
              value={settings?.depositAmountMxn ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                setSettings((prev) => ({
                  ...prev,
                  depositAmountMxn: raw === '' ? undefined : Math.max(0, parseInt(raw, 10) || 0),
                }));
              }}
            />
            <span className="adm-svc-apple__currency">MXN</span>
          </div>
          <span className="adm-svc-apple__base-deposit-hint">
            Por defecto $250 si no defines otro monto
          </span>
        </label>
      </div>

      <div className="adm-svc-apple__list">
        {[...categories.entries()].map(([category, items]) => {
          const catState = getCategoryState(items);
          const activeInCat = items.filter((s) => getConfig(s).active).length;

          return (
            <div key={category} className="adm-svc-apple__section">
              <div className="adm-svc-apple__section-head">
                <div className="adm-svc-apple__section-title">
                  <h3>{category}</h3>
                  <span>{activeInCat}/{items.length} activos</span>
                </div>
                <label className="adm-svc-apple__cat-toggle" title="Activar o desactivar todo el grupo">
                  <span className="adm-svc-apple__cat-toggle-label">
                    {catState === 'mixed' ? 'Parcial' : catState === 'on' ? 'Grupo activo' : 'Grupo oculto'}
                  </span>
                  <span className={`adm-ios-toggle adm-ios-toggle--sm ${catState === 'mixed' ? 'is-mixed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={catState === 'on'}
                      onChange={(e) => setCategoryActive(items, e.target.checked)}
                    />
                    <span />
                  </span>
                </label>
              </div>

              <div className="adm-svc-apple__table">
                <div className="adm-svc-apple__thead" aria-hidden>
                  <span>On</span>
                  <span>Tratamiento</span>
                  <span>Duración</span>
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
                        <label className="adm-ios-toggle adm-ios-toggle--sm" title={cfg.active ? 'Activo' : 'Inactivo'}>
                          <input
                            type="checkbox"
                            checked={cfg.active}
                            onChange={(e) => updateService(service.id, { active: e.target.checked })}
                          />
                          <span />
                        </label>
                        <div className="adm-svc-apple__text">
                          <strong>{service.name}</strong>
                          <span className={`adm-svc-apple__status ${cfg.active ? 'is-on' : 'is-off'}`}>
                            {cfg.active ? 'Visible' : 'Oculto'}
                          </span>
                        </div>
                        <label className="adm-svc-apple__field adm-svc-apple__field--duration">
                          <span className="adm-svc-apple__field-label">Min</span>
                          <input
                            type="number"
                            className="adm-svc-apple__input adm-svc-apple__input--duration"
                            min="15"
                            step="15"
                            value={cfg.durationMinutes}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (v > 0) updateService(service.id, { durationMinutes: v });
                            }}
                          />
                          <span className="adm-svc-apple__duration-hint">
                            {formatDuration(cfg.durationMinutes)}
                          </span>
                        </label>
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
                              placeholder={String(baseDeposit)}
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
            </div>
          );
        })}

        {!categories.size ? (
          <p className="adm-apple-empty">No hay servicios que coincidan con tu búsqueda</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminServicesTab;
