import { BOOKING_CONFIG } from '../../constants/booking';

const AdminConfigTab = ({
  settings,
  setSettings,
  onSave,
  saveMsg,
  status,
  oauthCallbackUrl,
  onConnect,
  onDisconnect,
}) => {
  const updateScheduleWindow = (dayKey, index, field, value) => {
    setSettings((prev) => {
      const schedule = { ...prev.schedule };
      const windows = [...schedule[dayKey]];
      windows[index] = [...windows[index]];
      windows[index][field === 'start' ? 0 : 1] = parseInt(value, 10);
      schedule[dayKey] = windows;
      return { ...prev, schedule };
    });
  };

  return (
    <div className="adm-config">
      <header className="adm-config__head">
        <h2>Configuración</h2>
        <p>Horarios, pagos y conexiones del consultorio.</p>
      </header>

      <form onSubmit={onSave} className="adm-config__sections">
        <section className="adm-config__block">
          <h3>Pagos con Stripe</h3>
          <p className="adm-muted">
            {status?.stripeReady
              ? '✓ Stripe conectado — se genera link de anticipo al reservar.'
              : 'Agrega STRIPE_SECRET_KEY en Supabase Secrets para activar pagos.'}
          </p>
          <label className="admin-label">Anticipo base (MXN)</label>
          <input
            type="number"
            className="admin-input"
            min="50"
            step="50"
            value={settings?.depositAmountMxn ?? 250}
            onChange={(e) => setSettings({ ...settings, depositAmountMxn: parseInt(e.target.value, 10) || 250 })}
          />
          <p className="adm-muted">Se cobra al confirmar la cita (por defecto $250 MXN).</p>
        </section>

        <section className="adm-config__block">
          <h3>Horarios de atención</h3>
          <p className="adm-muted">Hora Ciudad de México. Los cambios aplican al calendario público.</p>
          <div className="admin-schedule-grid">
            <div className="admin-schedule-block">
              <h4>Lunes – Viernes</h4>
              {settings?.schedule?.weekday?.map((win, i) => (
                <div key={`wd-${i}`} className="admin-time-row">
                  <input type="number" min="0" max="23" value={win[0]} onChange={(e) => updateScheduleWindow('weekday', i, 'start', e.target.value)} /> :
                  <span>a</span>
                  <input type="number" min="0" max="23" value={win[1]} onChange={(e) => updateScheduleWindow('weekday', i, 'end', e.target.value)} /> h
                </div>
              ))}
            </div>
            <div className="admin-schedule-block">
              <h4>Sábado</h4>
              {settings?.schedule?.saturday?.map((win, i) => (
                <div key={`sat-${i}`} className="admin-time-row">
                  <input type="number" min="0" max="23" value={win[0]} onChange={(e) => updateScheduleWindow('saturday', i, 'start', e.target.value)} /> :
                  <span>a</span>
                  <input type="number" min="0" max="23" value={win[1]} onChange={(e) => updateScheduleWindow('saturday', i, 'end', e.target.value)} /> h
                </div>
              ))}
            </div>
          </div>
          <label className="admin-label">Resumen en el sitio</label>
          <input
            className="admin-input"
            value={settings?.scheduleSummary ?? BOOKING_CONFIG.scheduleSummary}
            onChange={(e) => setSettings({ ...settings, scheduleSummary: e.target.value })}
          />
          <div className="admin-row-2">
            <div>
              <label className="admin-label">Intervalo (min)</label>
              <input
                type="number"
                className="admin-input"
                min="5"
                max="60"
                value={settings?.slotIntervalMinutes ?? 15}
                onChange={(e) => setSettings({ ...settings, slotIntervalMinutes: parseInt(e.target.value, 10) })}
              />
            </div>
            <div>
              <label className="admin-label">Buffer (min)</label>
              <input
                type="number"
                className="admin-input"
                min="0"
                max="60"
                value={settings?.bufferMinutes ?? 10}
                onChange={(e) => setSettings({ ...settings, bufferMinutes: parseInt(e.target.value, 10) })}
              />
            </div>
          </div>
        </section>

        <section className="adm-config__block">
          <h3>Google Calendar</h3>
          <div className={`gcal-pill ${status?.calendar?.connected ? 'gcal-pill--on' : 'gcal-pill--off'}`}>
            <span className="gcal-pill__dot" />
            <div>
              <strong>{status?.calendar?.connected ? status.calendar.email : 'Sin conectar'}</strong>
            </div>
            {status?.calendar?.connected ? (
              <button type="button" className="gcal-pill__btn" onClick={onDisconnect}>Desconectar</button>
            ) : (
              <button type="button" className="gcal-pill__btn gcal-pill__btn--primary" onClick={onConnect}>Conectar</button>
            )}
          </div>
          <p className="adm-muted">Redirect URI: <code>{oauthCallbackUrl}</code></p>
        </section>

        <button type="submit" className="btn-primary">Guardar configuración</button>
        {saveMsg ? <p className={`admin-toast ${saveMsg.includes('Error') ? 'admin-toast--err' : 'admin-toast--ok'}`}>{saveMsg}</p> : null}
      </form>
    </div>
  );
};

export default AdminConfigTab;
