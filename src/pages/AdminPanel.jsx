import { useCallback, useEffect, useState } from 'react';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';
import AdminCalendarTab from '../components/admin/AdminCalendarTab';
import AdminConfigTab from '../components/admin/AdminConfigTab';
import AdminServicesTab from '../components/admin/AdminServicesTab';
import {
  deleteAdminBooking,
  disconnectGoogleCalendar,
  getAdminDashboard,
  getAdminSettings,
  resendAllPaidBookingEmails,
  resendBookingEmail,
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
  { id: 'resumen', label: 'Resumen' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'configuracion', label: 'Configuración' },
];

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab === 'horarios' || tab === 'reservas' || tab === 'pagos') return 'configuracion';
  return tab || 'calendario';
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
  const [monthOffset, setMonthOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [resendingAll, setResendingAll] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const urlError = urlParams.get('error');
  const urlConnected = urlParams.get('connected');

  const supabaseReady = isSupabaseConfigured();

  const loadStatus = useCallback(async (opts = {}) => {
    const mo = opts.monthOffset ?? monthOffset;
    try {
      setStatusError('');
      const data = await getAdminDashboard({ monthOffset: mo });
      setStatus(data);
    } catch (err) {
      setStatusError(err.message || 'No se pudo cargar el panel');
    }
  }, [monthOffset]);

  const handleRangeChange = useCallback(async ({ monthOffset: nextOffset }) => {
    const mo = nextOffset ?? monthOffset;
    if (nextOffset !== undefined) setMonthOffset(mo);
    setRefreshing(true);
    try {
      setStatusError('');
      const data = await getAdminDashboard({ monthOffset: mo });
      setStatus(data);
    } catch (err) {
      setStatusError(err.message || 'No se pudo cargar el panel');
    } finally {
      setRefreshing(false);
    }
  }, [monthOffset]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStatus();
    } finally {
      setRefreshing(false);
    }
  }, [loadStatus]);

  const handleDeleteBooking = useCallback(async (apt) => {
    setDeletingId(apt.id);
    try {
      await deleteAdminBooking({ source: apt.source, id: apt.id });
      await loadStatus();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar la cita');
      throw err;
    } finally {
      setDeletingId(null);
    }
  }, [loadStatus]);

  const handleResendBookingEmail = useCallback(async (apt, { includePatient = false } = {}) => {
    if (apt.source !== 'site') return;
    setResendingId(apt.id);
    try {
      const data = await resendBookingEmail({ id: apt.id, includePatient });
      alert(data.message || 'Correo reenviado');
    } catch (err) {
      alert(err.message || 'No se pudo reenviar el correo');
      throw err;
    } finally {
      setResendingId(null);
    }
  }, []);

  const handleResendAllPaidEmails = useCallback(async () => {
    const ok = window.confirm(
      '¿Reenviar correo al doctor para todas las reservas con anticipo pagado?',
    );
    if (!ok) return;

    setResendingAll(true);
    try {
      const data = await resendAllPaidBookingEmails();
      alert(data.message || 'Correos reenviados');
    } catch (err) {
      alert(err.message || 'No se pudieron reenviar los correos');
    } finally {
      setResendingAll(false);
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
    e?.preventDefault?.();
    setSaveMsg('');
    try {
      await saveAdminSettings(settings);
      setSaveMsg('Guardado correctamente');
      await loadStatus();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message || 'Error al guardar');
    }
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
            <span>Panel Admin</span>
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

      <main className="admin-main admin-main--wide">
        {tab === 'resumen' && (
          <AdminAnalyticsTab
            status={status}
            statusError={statusError}
            refreshing={refreshing}
            resendingAll={resendingAll}
            resendingId={resendingId}
            onRefresh={handleRefresh}
            onGoCalendar={() => setTab('calendario')}
            onResendAllPaid={handleResendAllPaidEmails}
            onResendBooking={handleResendBookingEmail}
          />
        )}

        {tab === 'calendario' && (
          <AdminCalendarTab
            status={status}
            statusError={statusError}
            monthOffset={monthOffset}
            refreshing={refreshing}
            deletingId={deletingId}
            resendingId={resendingId}
            onRangeChange={handleRangeChange}
            onRefresh={handleRefresh}
            onDelete={handleDeleteBooking}
            onResendEmail={handleResendBookingEmail}
          />
        )}

        {tab === 'servicios' && settings && (
          <AdminServicesTab
            settings={settings}
            setSettings={setSettings}
            onSave={saveSettingsHandler}
            saveMsg={saveMsg}
          />
        )}

        {tab === 'configuracion' && settings && (
          <AdminConfigTab
            settings={settings}
            setSettings={setSettings}
            onSave={saveSettingsHandler}
            saveMsg={saveMsg}
            status={status}
            urlConnected={urlConnected}
            urlError={urlError}
            oauthCallbackUrl={oauthCallbackUrl}
            onConnect={connectCalendar}
            onDisconnect={disconnectCalendar}
          />
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
