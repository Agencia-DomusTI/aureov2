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
  const [statusError, setStatusError] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const urlError = urlParams.get('error');
  const urlConnected = urlParams.get('connected');

  const supabaseReady = isSupabaseConfigured();

  const loadStatus = useCallback(async () => {
    try {
      setStatusError('');
      const data = await getAdminDashboard();
      setStatus(data);
    } catch (err) {
      setStatusError(err.message || 'No se pudo cargar el panel');
    }
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
          <section className="admin-card admin-card--calendar">
            {urlConnected === '1' ? (
              <p className="admin-toast admin-toast--ok">✓ Calendario conectado correctamente</p>
            ) : null}
            {urlError ? (
              <p className="admin-toast admin-toast--err">Error: {decodeURIComponent(urlError)}</p>
            ) : null}
            {statusError ? (
              <p className="admin-toast admin-toast--err">{statusError}</p>
            ) : null}

            <div className={`gcal-card ${status?.calendar?.connected ? 'gcal-card--on' : 'gcal-card--off'}`}>
              <div className="gcal-card__top">
                <div className="gcal-card__brand">
                  <span className="gcal-card__icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" stroke="#4285F4" strokeWidth="1.5" />
                      <rect x="3" y="4" width="18" height="5" fill="#4285F4" />
                      <circle cx="8" cy="14" r="2" fill="#34A853" />
                      <circle cx="12" cy="14" r="2" fill="#FBBC05" />
                      <circle cx="16" cy="14" r="2" fill="#EA4335" />
                    </svg>
                  </span>
                  <div>
                    <h2>Google Calendar</h2>
                    <span className={`gcal-badge ${status?.calendar?.connected ? 'gcal-badge--on' : 'gcal-badge--off'}`}>
                      {status?.calendar?.connected ? 'Conectado' : 'Sin conectar'}
                    </span>
                  </div>
                </div>
              </div>

              {status?.calendar?.connected ? (
                <>
                  <div className="gcal-card__body">
                    <p className="gcal-card__email">{status.calendar.email}</p>
                    <p className="gcal-card__meta">
                      Sincronizado desde {new Date(status.calendar.connectedAt).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <p className="gcal-card__hint">
                      Las citas del sitio se agregan automáticamente y no se empalman con otras reservas.
                    </p>
                  </div>
                  <button type="button" className="gcal-btn gcal-btn--ghost" onClick={disconnectCalendar}>
                    Desconectar
                  </button>
                </>
              ) : (
                <>
                  <div className="gcal-card__body">
                    <p className="gcal-card__hint">
                      Conecta el calendario del doctor para sincronizar las reservas del sitio en tiempo real.
                    </p>
                  </div>
                  {status?.googleOAuthReady ? (
                    <button type="button" className="gcal-btn gcal-btn--google" onClick={connectCalendar}>
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Conectar con Google
                    </button>
                  ) : status ? (
                    <p className="admin-toast admin-toast--err admin-toast--inline">
                      Faltan credenciales de Google en Supabase.
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {!status?.calendar?.connected ? (
              <details className="gcal-help">
                <summary>¿Primera vez configurando?</summary>
                <ol>
                  <li>Activa Calendar API en Google Cloud</li>
                  <li>URI de redirección: <code>{oauthCallbackUrl}</code></li>
                  <li>Secrets en Supabase: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SITE_URL</li>
                </ol>
              </details>
            ) : null}
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
