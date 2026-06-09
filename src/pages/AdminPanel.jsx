import { useCallback, useEffect, useState } from 'react';
import { BOOKING_CONFIG } from '../constants/booking';
import {
  disconnectGoogleCalendar,
  getAdminDashboard,
  getAdminSettings,
  saveAdminSettings,
  startGoogleConnect,
} from '../lib/bookingApi';
import {
  adminLogin,
  adminMe,
  adminSetup,
  clearAdminToken,
  isSupabaseConfigured,
} from '../lib/adminAuth';
import './AdminPanel.css';

const TABS = [
  { id: 'calendario', label: 'Calendario' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'pagos', label: 'Pagos' },
];

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'calendario';
}

const AdminPanel = () => {
  const [authenticated, setAuthenticated] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(getTabFromUrl);
  const [status, setStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [setupMode, setSetupMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('setup') === '1';
  });
  const [setupSecret, setSetupSecret] = useState('');
  const [adminName, setAdminName] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const urlError = urlParams.get('error');
  const urlConnected = urlParams.get('connected');

  const supabaseReady = isSupabaseConfigured();

  const loadStatus = useCallback(async () => {
    const data = await getAdminDashboard();
    setStatus(data);
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await getAdminSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setAuthenticated(false);
      return;
    }

    adminMe()
      .then((session) => {
        const ok = Boolean(session?.authenticated);
        setAuthenticated(ok);
        if (ok) {
          loadStatus();
          loadSettings();
        }
      })
      .catch(() => setAuthenticated(false));
  }, [supabaseReady, loadStatus, loadSettings]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      setAuthenticated(true);
      setPassword('');
      await loadStatus();
      await loadSettings();
    } catch (err) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await adminSetup({ email, password, name: adminName, setupSecret });
      setAuthenticated(true);
      setPassword('');
      setSetupSecret('');
      await loadStatus();
      await loadSettings();
    } catch (err) {
      setLoginError(err.message || 'Error al crear administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    clearAdminToken();
    setAuthenticated(false);
    setStatus(null);
  };

  const connectCalendar = async () => {
    try {
      const { authUrl } = await startGoogleConnect();
      window.location.href = authUrl;
    } catch (err) {
      alert(err.message || 'No se pudo iniciar la conexión');
    }
  };

  const disconnectCalendar = async () => {
    if (!window.confirm('¿Desconectar Google Calendar?')) return;
    await disconnectGoogleCalendar();
    loadStatus();
  };

  const saveSettingsHandler = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    try {
      await saveAdminSettings(settings);
      setSaveMsg('Configuración guardada');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Error al guardar');
    }
  };

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

  const oauthCallbackUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-google-callback`
    : 'https://TU-PROYECTO.supabase.co/functions/v1/admin-google-callback';

  if (authenticated === null && supabaseReady) {
    return <div className="admin admin--loading">Cargando panel…</div>;
  }

  if (!supabaseReady || !authenticated) {
    return (
      <div className="admin admin--login">
        <div className="admin-login-card">
          <img src="/logosin.png" alt="Áureo Clinique" className="admin-login-logo" />
          <h1>Panel Admin</h1>
          <p>Gestiona citas, calendario y horarios de Aureo Clinique Querétaro.</p>
          {!supabaseReady ? (
            <p className="admin-error">
              Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Cloudflare Pages.
            </p>
          ) : setupMode ? (
            <form onSubmit={handleSetup}>
              <p className="admin-setup-note">Crea el primer administrador del panel.</p>
              <label htmlFor="admin-name">Nombre</label>
              <input
                id="admin-name"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Dr. Demetrio"
              />
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aureoclinique.com"
                required
              />
              <label htmlFor="admin-pass">Contraseña</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
              <label htmlFor="setup-secret">Clave de configuración</label>
              <input
                id="setup-secret"
                type="password"
                value={setupSecret}
                onChange={(e) => setSetupSecret(e.target.value)}
                placeholder="ADMIN_SETUP_SECRET de Supabase"
                required
              />
              {loginError ? <p className="admin-error">{loginError}</p> : null}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creando…' : 'Crear administrador'}
              </button>
              <button type="button" className="admin-toggle-mode" onClick={() => setSetupMode(false)}>
                Ya tengo cuenta → Iniciar sesión
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aureoclinique.com"
                required
              />
              <label htmlFor="admin-pass">Contraseña</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
              {loginError ? <p className="admin-error">{loginError}</p> : null}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
              <button type="button" className="admin-toggle-mode" onClick={() => setSetupMode(true)}>
                Primera vez → Crear administrador
              </button>
            </form>
          )}
          <a href="/" className="admin-back">← Volver al sitio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header__brand">
          <img src="/logosin.png" alt="" className="admin-header__logo" />
          <div>
            <strong>Áureo Clinique</strong>
            <span>Panel Admin · Supabase</span>
          </div>
        </div>
        <div className="admin-header__actions">
          <a href="/#contacto" className="admin-link">Ver sitio</a>
          <button type="button" className="admin-link admin-link--btn" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {tab === 'calendario' && (
          <section className="admin-card">
            <h2>Google Calendar</h2>
            <p className="admin-card__lead">
              Conecta el calendario del doctor. Las reservas del sitio (Cloudflare) se sincronizan
              vía Supabase y no se empalman con otras citas.
            </p>

            {urlConnected === '1' ? (
              <p className="admin-success">✓ Calendario conectado correctamente</p>
            ) : null}
            {urlError ? (
              <p className="admin-error">Error: {decodeURIComponent(urlError)}</p>
            ) : null}

            {status?.calendar?.connected ? (
              <div className="admin-calendar-status admin-calendar-status--connected">
                <span className="admin-status-dot" />
                <div>
                  <strong>Conectado</strong>
                  <p>{status.calendar.email}</p>
                  <p className="admin-muted">
                    Desde {new Date(status.calendar.connectedAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <button type="button" className="btn-secondary admin-disconnect" onClick={disconnectCalendar}>
                  Desconectar
                </button>
              </div>
            ) : (
              <div className="admin-calendar-status">
                <span className="admin-status-dot admin-status-dot--off" />
                <div>
                  <strong>Sin conectar</strong>
                  <p>Las citas usarán WhatsApp hasta conectar el calendario.</p>
                </div>
                {status?.googleOAuthReady ? (
                  <button type="button" className="btn-primary admin-connect" onClick={connectCalendar}>
                    Conectar Google Calendar
                  </button>
                ) : (
                  <p className="admin-error admin-error--inline">
                    Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Supabase → Edge Functions → Secrets.
                  </p>
                )}
              </div>
            )}

            <div className="admin-steps">
              <h3>¿Primera vez?</h3>
              <ol>
                <li>Ejecuta el SQL de <code>admin_users</code> en Supabase SQL Editor</li>
                <li>Configura secrets: ADMIN_JWT_SECRET y ADMIN_SETUP_SECRET</li>
                <li>Despliega funciones: admin-login, admin-setup, admin-me</li>
                <li>Google Cloud: activa Calendar API y crea OAuth (Aplicación web)</li>
                <li>URI de redirección: <code>{oauthCallbackUrl}</code></li>
                <li>Supabase → Project Settings → Edge Functions → Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SITE_URL</li>
                <li>Haz clic en <strong>Conectar Google Calendar</strong></li>
              </ol>
            </div>
          </section>
        )}

        {tab === 'horarios' && settings && (
          <section className="admin-card">
            <h2>Horarios de atención</h2>
            <p className="admin-card__lead">Hora Ciudad de México (CDMX). Los cambios aplican al calendario público de inmediato.</p>
            <form onSubmit={saveSettingsHandler}>
              <div className="admin-schedule-grid">
                <div className="admin-schedule-block">
                  <h3>Lunes – Viernes</h3>
                  {settings.schedule.weekday.map((win, i) => (
                    <div key={`wd-${i}`} className="admin-time-row">
                      <input type="number" min="0" max="23" value={win[0]} onChange={(e) => updateScheduleWindow('weekday', i, 'start', e.target.value)} /> :
                      <input type="number" min="0" max="59" value="0" disabled className="admin-time-min" />
                      <span>a</span>
                      <input type="number" min="0" max="23" value={win[1]} onChange={(e) => updateScheduleWindow('weekday', i, 'end', e.target.value)} /> h
                    </div>
                  ))}
                </div>
                <div className="admin-schedule-block">
                  <h3>Sábado</h3>
                  {settings.schedule.saturday.map((win, i) => (
                    <div key={`sat-${i}`} className="admin-time-row">
                      <input type="number" min="0" max="23" value={win[0]} onChange={(e) => updateScheduleWindow('saturday', i, 'start', e.target.value)} /> :
                      <input type="number" min="0" max="59" value="0" disabled className="admin-time-min" />
                      <span>a</span>
                      <input type="number" min="0" max="23" value={win[1]} onChange={(e) => updateScheduleWindow('saturday', i, 'end', e.target.value)} /> h
                    </div>
                  ))}
                </div>
              </div>
              <label className="admin-label">Resumen visible en el sitio</label>
              <input
                className="admin-input"
                value={settings.scheduleSummary ?? BOOKING_CONFIG.scheduleSummary}
                onChange={(e) => setSettings({ ...settings, scheduleSummary: e.target.value })}
              />
              <div className="admin-row-2">
                <div>
                  <label className="admin-label">Intervalo entre citas (min)</label>
                  <input
                    type="number"
                    className="admin-input"
                    min="5"
                    max="60"
                    value={settings.slotIntervalMinutes ?? 15}
                    onChange={(e) => setSettings({ ...settings, slotIntervalMinutes: parseInt(e.target.value, 10) })}
                  />
                </div>
                <div>
                  <label className="admin-label">Buffer entre citas (min)</label>
                  <input
                    type="number"
                    className="admin-input"
                    min="0"
                    max="60"
                    value={settings.bufferMinutes ?? 10}
                    onChange={(e) => setSettings({ ...settings, bufferMinutes: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>
              <p className="admin-muted">Domingo: solo con cita previa (WhatsApp).</p>
              <button type="submit" className="btn-primary">Guardar horarios</button>
              {saveMsg ? <p className="admin-success">{saveMsg}</p> : null}
            </form>
          </section>
        )}

        {tab === 'reservas' && (
          <section className="admin-card">
            <h2>Reservas recientes</h2>
            {!status?.bookings?.length ? (
              <p className="admin-muted">Aún no hay reservas registradas desde el sitio.</p>
            ) : (
              <div className="admin-bookings">
                {status.bookings.map((b) => (
                  <article key={b.id} className="admin-booking-item">
                    <strong>{b.service}</strong>
                    <span>{b.patient?.name} · {b.patient?.phone}</span>
                    <span>
                      {new Date(b.start).toLocaleString('es-MX', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City',
                      })}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'pagos' && settings && (
          <section className="admin-card">
            <h2>Link de pago</h2>
            <p className="admin-card__lead">
              URL de pago en línea (LeadConnector, Stripe, etc.) que se comparte tras confirmar la cita.
            </p>
            <form onSubmit={saveSettingsHandler}>
              <label className="admin-label">URL de pago</label>
              <input
                className="admin-input"
                type="url"
                placeholder="https://..."
                value={settings.paymentUrl ?? ''}
                onChange={(e) => setSettings({ ...settings, paymentUrl: e.target.value })}
              />
              <button type="submit" className="btn-primary">Guardar</button>
              {saveMsg ? <p className="admin-success">{saveMsg}</p> : null}
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
