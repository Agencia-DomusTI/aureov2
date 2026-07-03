import { useMemo, useState } from 'react';
import { formatDuration } from '../../constants/booking';
import { getAllBookableServices } from '../../utils/bookableServices';
import {
  buildCustomServiceConfig,
  createCustomServiceId,
  isCustomServiceId,
} from '../../utils/customServices';
import { getServiceDurationMinutes } from '../../utils/serviceConfig';

const EMPTY_FORM = {
  name: '',
  category: '',
  durationMinutes: 60,
  priceLabel: '',
  depositMxn: '',
};

function AddServiceModal({ categories, baseDeposit, onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    if (!name) {
      setError('Escribe el nombre del tratamiento.');
      return;
    }
    if (!category) {
      setError('Indica la categoría.');
      return;
    }
    onAdd({
      id: createCustomServiceId(),
      config: buildCustomServiceConfig({
        name,
        category,
        durationMinutes: form.durationMinutes,
        priceLabel: form.priceLabel,
        depositMxn: form.depositMxn === '' ? undefined : form.depositMxn,
        active: true,
      }),
    });
    onClose();
  };

  return (
    <div className="adm-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="adm-modal adm-modal--detail adm-svc-add"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="adm-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h3 className="adm-modal__title">Nuevo servicio</h3>
        <p className="adm-modal__desc">
          Aparecerá en el calendario de reservas. Los del catálogo fijo no se pueden crear aquí.
        </p>

        <form className="adm-svc-add__form" onSubmit={handleSubmit}>
          <label className="adm-svc-add__field">
            <span>Nombre del tratamiento</span>
            <input
              className="adm-svc-apple__input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Peeling químico"
              autoFocus
            />
          </label>

          <label className="adm-svc-add__field">
            <span>Categoría</span>
            <input
              className="adm-svc-apple__input"
              list="adm-svc-categories"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ej. Medicina Estética"
            />
            <datalist id="adm-svc-categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </label>

          <div className="adm-svc-add__row">
            <label className="adm-svc-add__field">
              <span>Duración (min)</span>
              <input
                type="number"
                className="adm-svc-apple__input"
                min="15"
                step="15"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 60 }))}
              />
            </label>
            <label className="adm-svc-add__field">
              <span>Anticipo (MXN)</span>
              <input
                type="number"
                className="adm-svc-apple__input"
                min="0"
                step="50"
                placeholder={String(baseDeposit)}
                value={form.depositMxn}
                onChange={(e) => setForm((f) => ({ ...f, depositMxn: e.target.value }))}
              />
            </label>
          </div>

          <label className="adm-svc-add__field">
            <span>Precio visible (opcional, uso interno)</span>
            <input
              className="adm-svc-apple__input"
              value={form.priceLabel}
              onChange={(e) => setForm((f) => ({ ...f, priceLabel: e.target.value }))}
              placeholder="Consultar en valoración"
            />
          </label>

          {error ? <p className="admin-toast admin-toast--err">{error}</p> : null}

          <div className="adm-modal__actions">
            <button type="button" className="adm-modal__btn adm-modal__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="adm-modal__btn adm-svc-add__submit">
              Agregar servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminServicesTab = ({ settings, setSettings, onSave, saveMsg }) => {
  const servicesConfig = settings?.servicesConfig ?? {};
  const baseDeposit = settings?.depositAmountMxn ?? 250;
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const allServices = useMemo(() => getAllBookableServices(servicesConfig), [servicesConfig]);

  const categories = useMemo(() => {
    const set = new Set(allServices.map((s) => s.category));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [allServices]);

  const groupedCategories = useMemo(() => {
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

  const customCount = useMemo(
    () => allServices.filter((s) => s.custom).length,
    [allServices],
  );

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
    const durationMinutes = service.custom
      ? (c.durationMinutes > 0 ? c.durationMinutes : service.durationMinutes)
      : getServiceDurationMinutes(service.id, servicesConfig);
    return {
      priceLabel: c.priceLabel ?? service.price ?? '',
      active: c.active !== false,
      depositMxn: c.depositMxn ?? '',
      durationMinutes,
      name: service.custom ? (c.name ?? service.name) : service.name,
      category: service.custom ? (c.category ?? service.category) : service.category,
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

  const addCustomService = ({ id, config }) => {
    setSettings((prev) => ({
      ...prev,
      servicesConfig: {
        ...prev.servicesConfig,
        [id]: config,
      },
    }));
  };

  const removeCustomService = (id) => {
    if (!isCustomServiceId(id)) return;
    if (!window.confirm('¿Eliminar este servicio personalizado?')) return;
    setSettings((prev) => {
      const next = { ...prev.servicesConfig };
      delete next[id];
      return { ...prev, servicesConfig: next };
    });
  };

  return (
    <div className="adm-svc-apple">
      {showAddModal ? (
        <AddServiceModal
          categories={categories}
          baseDeposit={baseDeposit}
          onClose={() => setShowAddModal(false)}
          onAdd={addCustomService}
        />
      ) : null}

      <header className="adm-svc-apple__head">
        <div>
          <h2>Servicios</h2>
          <p>
            {activeCount} de {allServices.length} activos
            {customCount > 0 ? ` · ${customCount} personalizado${customCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <div className="adm-svc-apple__head-actions">
          <button type="button" className="adm-svc-apple__add" onClick={() => setShowAddModal(true)}>
            + Agregar servicio
          </button>
          <button type="button" className="adm-svc-apple__save" onClick={onSave}>
            Guardar cambios
          </button>
        </div>
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
        {[...groupedCategories.entries()].map(([category, items]) => {
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
                  <span />
                </div>
                <div className="adm-svc-apple__group">
                  {items.map((service) => {
                    const cfg = getConfig(service);
                    const isCustom = Boolean(service.custom);
                    return (
                      <div
                        key={service.id}
                        className={`adm-svc-apple__row ${cfg.active ? '' : 'is-off'} ${isCustom ? 'is-custom' : ''}`}
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
                          {isCustom ? (
                            <>
                              <input
                                className="adm-svc-apple__input adm-svc-apple__input--name"
                                value={cfg.name}
                                onChange={(e) => updateService(service.id, { name: e.target.value })}
                              />
                              <input
                                className="adm-svc-apple__input adm-svc-apple__input--category"
                                list="adm-svc-categories-inline"
                                value={cfg.category}
                                onChange={(e) => updateService(service.id, { category: e.target.value })}
                                placeholder="Categoría"
                              />
                              <datalist id="adm-svc-categories-inline">
                                {categories.map((cat) => (
                                  <option key={cat} value={cat} />
                                ))}
                              </datalist>
                            </>
                          ) : (
                            <strong>{service.name}</strong>
                          )}
                          <span className={`adm-svc-apple__status ${cfg.active ? 'is-on' : 'is-off'}`}>
                            {isCustom ? 'Personalizado · ' : ''}
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
                        {isCustom ? (
                          <button
                            type="button"
                            className="adm-svc-apple__delete"
                            title="Eliminar servicio"
                            onClick={() => removeCustomService(service.id)}
                          >
                            ✕
                          </button>
                        ) : (
                          <span className="adm-svc-apple__delete-spacer" aria-hidden />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {!groupedCategories.size ? (
          <p className="adm-apple-empty">No hay servicios que coincidan con tu búsqueda</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminServicesTab;
