import { useMemo, useState } from 'react';

const TZ = 'America/Mexico_City';
const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const SPAN_OPTIONS = [
  { value: 1, label: '1 semana' },
  { value: 2, label: '2 semanas' },
  { value: 4, label: 'Mes' },
];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  });
}

function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function DeleteBtn({ apt, deletingId, onDelete, variant = 'icon' }) {
  if (!apt.canDelete) return null;
  const busy = deletingId === apt.id;
  return (
    <button
      type="button"
      className={`adm-del adm-del--${variant}`}
      title="Eliminar cita"
      disabled={busy}
      onClick={() => onDelete(apt)}
    >
      {busy ? 'Eliminando…' : variant === 'text' ? 'Eliminar' : '✕'}
    </button>
  );
}

function EventRow({ apt, deletingId, onDelete }) {
  return (
    <article className={`adm-event adm-event--${apt.source}`}>
      <div className="adm-event__stripe" aria-hidden />
      <div className="adm-event__body">
        <div className="adm-event__time">{formatTimeRange(apt.start, apt.end)}</div>
        <div className="adm-event__title">{apt.title}</div>
        <div className="adm-event__meta">
          {apt.subtitle}
          {apt.detail ? <span className="adm-event__detail"> · {apt.detail}</span> : null}
        </div>
      </div>
      <DeleteBtn apt={apt} deletingId={deletingId} onDelete={onDelete} variant="text" />
    </article>
  );
}

const AdminCalendarTab = ({
  status,
  statusError,
  weekOffset = 0,
  weeks = 2,
  refreshing = false,
  deletingId = null,
  onRangeChange,
  onRefresh,
  onDelete,
}) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [panel, setPanel] = useState('dia');

  const weekDays = status?.weekDays ?? [];
  const activeDay = useMemo(() => {
    if (selectedDay) return weekDays.find((d) => d.date === selectedDay);
    return weekDays.find((d) => d.isToday) ?? weekDays[0];
  }, [weekDays, selectedDay]);

  const weekGroups = useMemo(() => {
    const groups = [];
    weekDays.forEach((day) => {
      const idx = day.weekIndex ?? 0;
      if (!groups[idx]) groups[idx] = [];
      groups[idx].push(day);
    });
    return groups.filter(Boolean);
  }, [weekDays]);

  const periodList = useMemo(
    () => weekDays.filter((d) => d.count > 0),
    [weekDays],
  );

  const monthTitle = useMemo(() => {
    if (!weekDays.length) return '';
    const mid = weekDays[Math.floor(weekDays.length / 2)];
    return mid?.monthLabel ?? status?.rangeLabel ?? '';
  }, [weekDays, status?.rangeLabel]);

  const handleDelete = (apt) => {
    const label = apt.subtitle ? `${apt.title} — ${apt.subtitle}` : apt.title;
    if (!window.confirm(`¿Eliminar la cita de ${label}?\n\nSe quitará del calendario.`)) return;
    onDelete?.(apt);
  };

  const goToday = () => {
    setSelectedDay(null);
    onRangeChange?.({ weekOffset: 0 });
  };

  return (
    <div className="adm-dash adm-dash--apple">
      {statusError ? <p className="admin-toast admin-toast--err">{statusError}</p> : null}

      <section className="adm-apple-cal">
        <header className="adm-apple-cal__head">
          <div className="adm-apple-cal__nav">
            <button
              type="button"
              className="adm-apple-cal__chev"
              onClick={() => onRangeChange?.({ weekOffset: weekOffset - 1 })}
              disabled={refreshing}
              aria-label="Periodo anterior"
            >
              ‹
            </button>
            <div className="adm-apple-cal__title">
              <strong>{monthTitle || 'Calendario'}</strong>
              <span>{status?.rangeLabel}</span>
            </div>
            <button
              type="button"
              className="adm-apple-cal__chev"
              onClick={() => onRangeChange?.({ weekOffset: weekOffset + 1 })}
              disabled={refreshing}
              aria-label="Periodo siguiente"
            >
              ›
            </button>
          </div>

          <div className="adm-apple-cal__tools">
            <button
              type="button"
              className="adm-apple-cal__today"
              onClick={goToday}
              disabled={refreshing || weekOffset === 0}
            >
              Hoy
            </button>
            <button
              type="button"
              className="adm-apple-cal__refresh"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Actualizar"
            >
              {refreshing ? '…' : '↻'}
            </button>
          </div>
        </header>

        <div className="adm-seg adm-seg--span">
          {SPAN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={weeks === opt.value ? 'is-active' : ''}
              onClick={() => onRangeChange?.({ weeks: opt.value, weekOffset: 0 })}
              disabled={refreshing}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="adm-apple-layout">
          <div className="adm-apple-grid-wrap">
            <div className="adm-apple-weekdays">
              {WEEK_HEADERS.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            <div className="adm-apple-grid-body">
              {weekGroups.map((group, wi) => (
                <div key={wi} className="adm-apple-week">
                  {group.map((day) => {
                    const isSelected = activeDay?.date === day.date;
                    const preview = day.appointments?.slice(0, 3) ?? [];
                    const extra = Math.max(0, (day.count ?? 0) - preview.length);
                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={[
                          'adm-apple-day',
                          day.isToday ? 'is-today' : '',
                          isSelected ? 'is-selected' : '',
                          day.count > 0 ? 'has-events' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => { setSelectedDay(day.date); setPanel('dia'); }}
                      >
                        <span className="adm-apple-day__num">{day.dayNum ?? Number(day.date.split('-')[2])}</span>
                        {preview.length > 0 ? (
                          <span className="adm-apple-day__events">
                            {preview.map((apt) => (
                              <span
                                key={`${apt.source}-${apt.id}`}
                                className={`adm-apple-day__chip adm-apple-day__chip--${apt.source}`}
                              >
                                {formatTime(apt.start)} {apt.title}
                              </span>
                            ))}
                            {extra > 0 ? (
                              <span className="adm-apple-day__more">+{extra} más</span>
                            ) : null}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <aside className="adm-apple-side">
            <div className="adm-seg adm-seg--panel">
              <button
                type="button"
                className={panel === 'dia' ? 'is-active' : ''}
                onClick={() => setPanel('dia')}
              >
                Día
              </button>
              <button
                type="button"
                className={panel === 'lista' ? 'is-active' : ''}
                onClick={() => setPanel('lista')}
              >
                Lista
              </button>
            </div>

            {panel === 'dia' ? (
              <>
                <header className="adm-apple-side__head">
                  <h3>{activeDay?.label ?? 'Selecciona un día'}</h3>
                  <span>{activeDay?.appointments?.length ?? 0} citas</span>
                </header>
                {!activeDay?.appointments?.length ? (
                  <p className="adm-apple-empty">Sin citas este día</p>
                ) : (
                  <div className="adm-apple-events">
                    {activeDay.appointments.map((apt) => (
                      <EventRow
                        key={`${apt.source}-${apt.id}`}
                        apt={apt}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <header className="adm-apple-side__head">
                  <h3>Todas las citas</h3>
                  <span>{status?.stats?.range ?? 0} en total</span>
                </header>
                {!periodList.length ? (
                  <p className="adm-apple-empty">Sin citas en este periodo</p>
                ) : (
                  <div className="adm-apple-period">
                    {periodList.map((day) => (
                      <section key={day.date} className="adm-apple-period__day">
                        <h4 className={day.isToday ? 'is-today' : ''}>{day.label}</h4>
                        {day.appointments.map((apt) => (
                          <EventRow
                            key={`${apt.source}-${apt.id}`}
                            apt={apt}
                            deletingId={deletingId}
                            onDelete={handleDelete}
                          />
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default AdminCalendarTab;
