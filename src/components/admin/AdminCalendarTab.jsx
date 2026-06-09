import { useMemo, useState } from 'react';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  });
}

const AdminCalendarTab = ({
  status,
  statusError,
  urlConnected,
  urlError,
  oauthCallbackUrl,
  onConnect,
  onDisconnect,
}) => {
  const [selectedDay, setSelectedDay] = useState(null);

  const weekDays = status?.weekDays ?? [];
  const activeDay = useMemo(() => {
    if (selectedDay) return weekDays.find((d) => d.date === selectedDay);
    return weekDays.find((d) => d.isToday) ?? weekDays[0];
  }, [weekDays, selectedDay]);

  const maxTop = Math.max(1, ...(status?.topServices?.map((s) => s.count) ?? [1]));

  return (
    <div className="adm-dash">
      {urlConnected === '1' ? <p className="admin-toast admin-toast--ok">✓ Calendario conectado</p> : null}
      {urlError ? <p className="admin-toast admin-toast--err">Error: {decodeURIComponent(urlError)}</p> : null}
      {statusError ? <p className="admin-toast admin-toast--err">{statusError}</p> : null}

      <div className="adm-stats">
        <article className="adm-stat">
          <span className="adm-stat__num">{status?.stats?.today ?? '—'}</span>
          <span className="adm-stat__label">Citas hoy</span>
        </article>
        <article className="adm-stat">
          <span className="adm-stat__num">{status?.stats?.week ?? '—'}</span>
          <span className="adm-stat__label">Esta semana</span>
        </article>
        <article className="adm-stat adm-stat--wide">
          <span className="adm-stat__label">Servicio más solicitado</span>
          <strong>{status?.topServices?.[0]?.name ?? '—'}</strong>
          {status?.topServices?.[0] ? (
            <span className="adm-stat__sub">{status.topServices[0].count} reservas</span>
          ) : null}
        </article>
      </div>

      <div className="adm-week">
        {weekDays.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`adm-week__day ${day.isToday ? 'is-today' : ''} ${activeDay?.date === day.date ? 'is-active' : ''}`}
            onClick={() => setSelectedDay(day.date)}
          >
            <span className="adm-week__label">{day.label}</span>
            <span className={`adm-week__count ${day.count > 0 ? 'has-citas' : ''}`}>{day.count}</span>
          </button>
        ))}
      </div>

      <section className="adm-agenda">
        <header className="adm-agenda__head">
          <h3>{activeDay ? activeDay.label : 'Agenda'}</h3>
          <span>{activeDay?.appointments?.length ?? 0} citas</span>
        </header>
        {!activeDay?.appointments?.length ? (
          <p className="adm-agenda__empty">Sin citas este día</p>
        ) : (
          <div className="adm-agenda__list">
            {activeDay.appointments.map((apt) => (
              <article key={`${apt.source}-${apt.id}`} className={`adm-apt adm-apt--${apt.source}`}>
                <time>{formatTime(apt.start)}</time>
                <div>
                  <strong>{apt.title}</strong>
                  <span>{apt.subtitle}</span>
                </div>
                <span className="adm-apt__tag">{apt.source === 'google' ? 'Google' : 'Sitio'}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="adm-grid-2">
        <section className="adm-card-sm">
          <h4>Servicios populares</h4>
          {!status?.topServices?.length ? (
            <p className="adm-muted">Aún no hay datos</p>
          ) : (
            <ul className="adm-rank">
              {status.topServices.map((s, i) => (
                <li key={s.name}>
                  <span className="adm-rank__pos">{i + 1}</span>
                  <span className="adm-rank__name">{s.name}</span>
                  <span className="adm-rank__bar-wrap">
                    <span className="adm-rank__bar" style={{ width: `${(s.count / maxTop) * 100}%` }} />
                  </span>
                  <span className="adm-rank__count">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adm-card-sm">
          <h4>Google Calendar</h4>
          <div className={`gcal-pill ${status?.calendar?.connected ? 'gcal-pill--on' : 'gcal-pill--off'}`}>
            <span className="gcal-pill__dot" />
            <div>
              <strong>{status?.calendar?.connected ? 'Conectado' : 'Sin conectar'}</strong>
              <p>{status?.calendar?.connected ? status.calendar.email : 'Sincroniza tus citas'}</p>
            </div>
            {status?.calendar?.connected ? (
              <button type="button" className="gcal-pill__btn" onClick={onDisconnect}>Desconectar</button>
            ) : status?.googleOAuthReady ? (
              <button type="button" className="gcal-pill__btn gcal-pill__btn--primary" onClick={onConnect}>Conectar</button>
            ) : (
              <span className="adm-muted">Faltan credenciales</span>
            )}
          </div>
          {!status?.calendar?.connected ? (
            <details className="gcal-help gcal-help--compact">
              <summary>Configurar OAuth</summary>
              <p className="adm-muted"><code>{oauthCallbackUrl}</code></p>
            </details>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default AdminCalendarTab;
