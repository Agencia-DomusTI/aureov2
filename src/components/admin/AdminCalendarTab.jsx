import { useEffect, useMemo, useState } from 'react';

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

function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  });
}

function getDurationMinutes(apt) {
  if (apt.durationMinutes) return apt.durationMinutes;
  if (apt.start && apt.end) {
    return Math.round((new Date(apt.end) - new Date(apt.start)) / 60000);
  }
  return null;
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function waHref(phone) {
  const digits = phone.replace(/\D/g, '');
  const num = digits.startsWith('52') ? digits : `52${digits}`;
  return `https://wa.me/${num}`;
}

function aptKey(apt) {
  return `${apt.source}-${apt.id}`;
}

function selectApt(apt, { setSelectedDay, setPanel, setSelectedApt }) {
  if (!apt) return;
  const dayKey = new Date(apt.start).toLocaleDateString('en-CA', { timeZone: TZ });
  setSelectedDay(dayKey);
  setPanel('dia');
  setSelectedApt(apt);
}

function DeleteBtn({ apt, deletingId, onRequestDelete, variant = 'icon' }) {
  if (!apt.canDelete) return null;
  const busy = deletingId === apt.id;
  return (
    <button
      type="button"
      className={`adm-del adm-del--${variant}`}
      title="Eliminar cita"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onRequestDelete(apt);
      }}
    >
      {busy ? 'Eliminando…' : variant === 'text' ? 'Eliminar' : '✕'}
    </button>
  );
}

function DeleteConfirmModal({ apt, deleting, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [deleting, onCancel]);

  if (!apt) return null;

  const patient = apt.patientName || apt.subtitle || 'Sin paciente';

  return (
    <div
      className="adm-modal-overlay"
      role="presentation"
      onClick={() => { if (!deleting) onCancel(); }}
    >
      <div
        className="adm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="adm-delete-title"
        aria-describedby="adm-delete-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal__icon" aria-hidden>!</div>
        <h3 id="adm-delete-title" className="adm-modal__title">¿Eliminar esta cita?</h3>
        <p id="adm-delete-desc" className="adm-modal__desc">
          Esta acción no se puede deshacer. La cita se quitará del calendario
          {apt.source === 'site' ? ' y de las reservas del sitio' : ' de Google Calendar'}.
        </p>

        <div className="adm-modal__summary">
          <div className="adm-modal__summary-row">
            <span>Tratamiento</span>
            <strong>{apt.title}</strong>
          </div>
          <div className="adm-modal__summary-row">
            <span>Paciente</span>
            <strong>{patient}</strong>
          </div>
          <div className="adm-modal__summary-row">
            <span>Fecha</span>
            <strong>{formatDateLong(apt.start)}</strong>
          </div>
          <div className="adm-modal__summary-row">
            <span>Horario</span>
            <strong>{formatTimeRange(apt.start, apt.end)}</strong>
          </div>
        </div>

        <div className="adm-modal__actions">
          <button
            type="button"
            className="adm-modal__btn adm-modal__btn--ghost"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="adm-modal__btn adm-modal__btn--danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar cita'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventRow({ apt, selected, onSelect, deletingId, onRequestDelete }) {
  return (
    <article
      className={`adm-event adm-event--${apt.source} ${selected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(apt)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(apt);
        }
      }}
    >
      <div className="adm-event__stripe" aria-hidden />
      <div className="adm-event__body">
        <div className="adm-event__time">{formatTimeRange(apt.start, apt.end)}</div>
        <div className="adm-event__title">{apt.title}</div>
        <div className="adm-event__meta">
          {apt.subtitle}
          {apt.detail ? <span className="adm-event__detail"> · {apt.detail}</span> : null}
        </div>
      </div>
      <DeleteBtn apt={apt} deletingId={deletingId} onRequestDelete={onRequestDelete} variant="text" />
    </article>
  );
}

function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="adm-apt-detail__row">
      <span className="adm-apt-detail__label">{label}</span>
      <span className="adm-apt-detail__value">{children}</span>
    </div>
  );
}

function AppointmentDetail({ apt, deletingId, onBack, onRequestDelete }) {
  const waLink = apt.patientPhone ? waHref(apt.patientPhone) : null;

  return (
    <div className="adm-apt-detail">
      <button type="button" className="adm-apt-detail__back" onClick={onBack}>
        ← Volver
      </button>

      <header className="adm-apt-detail__head">
        <span className={`adm-apt-detail__badge adm-apt-detail__badge--${apt.source}`}>
          {apt.sourceLabel ?? (apt.source === 'google' ? 'Google' : 'Sitio')}
        </span>
        <h3>{apt.title}</h3>
        <p className="adm-apt-detail__when">{formatDateLong(apt.start)}</p>
        <p className="adm-apt-detail__time">{formatTimeRange(apt.start, apt.end)}</p>
      </header>

      <div className="adm-apt-detail__grid">
        <DetailRow label="Paciente">{apt.patientName || apt.subtitle || '—'}</DetailRow>
        <DetailRow label="Teléfono">
          {apt.patientPhone ? (
            <a href={`tel:${apt.patientPhone.replace(/\s/g, '')}`}>{apt.patientPhone}</a>
          ) : '—'}
        </DetailRow>
        {apt.source === 'site' ? (
          <DetailRow label="Email">
            {apt.patientEmail ? (
              <a href={`mailto:${apt.patientEmail}`}>{apt.patientEmail}</a>
            ) : '—'}
          </DetailRow>
        ) : null}
        <DetailRow label="Duración">{formatDuration(getDurationMinutes(apt))}</DetailRow>
        {apt.confirmationCode ? (
          <DetailRow label="Código">
            <code className="adm-apt-detail__code">{apt.confirmationCode}</code>
          </DetailRow>
        ) : null}
        {apt.depositAmountMxn > 0 ? (
          <DetailRow label="Anticipo">
            ${apt.depositAmountMxn} MXN
            {apt.depositPaid ? ' · Pagado' : apt.paymentStatus === 'pending' ? ' · Pendiente' : ''}
          </DetailRow>
        ) : null}
        {apt.source === 'site' ? (
          <DetailRow label="Reservada">{formatDateTime(apt.createdAt)}</DetailRow>
        ) : null}
        {apt.patientNotes ? (
          <DetailRow label="Notas">{apt.patientNotes}</DetailRow>
        ) : null}
        {apt.eventId ? (
          <DetailRow label="ID calendario">
            <code className="adm-apt-detail__code">{apt.eventId}</code>
          </DetailRow>
        ) : null}
      </div>

      <div className="adm-apt-detail__actions">
        {waLink ? (
          <a
            href={waLink}
            className="adm-apt-detail__wa"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        ) : null}
        <DeleteBtn apt={apt} deletingId={deletingId} onRequestDelete={onRequestDelete} variant="text" />
      </div>
    </div>
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
  const [selectedApt, setSelectedApt] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const handleSelectApt = (apt) => {
    selectApt(apt, { setSelectedDay, setPanel, setSelectedApt });
  };

  const requestDelete = (apt) => setPendingDelete(apt);

  const cancelDelete = () => {
    if (!deletingId) setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const apt = pendingDelete;
    try {
      await onDelete?.(apt);
      if (selectedApt && aptKey(selectedApt) === aptKey(apt)) {
        setSelectedApt(null);
      }
      setPendingDelete(null);
    } catch {
      /* AdminPanel muestra alert; mantener modal abierto */
    }
  };

  const isDeletingPending = pendingDelete && deletingId === pendingDelete.id;

  const goToday = () => {
    setSelectedDay(null);
    setSelectedApt(null);
    onRangeChange?.({ weekOffset: 0 });
  };

  const selectedKey = selectedApt ? aptKey(selectedApt) : null;

  return (
    <div className="adm-dash adm-dash--apple">
      <DeleteConfirmModal
        apt={pendingDelete}
        deleting={Boolean(isDeletingPending)}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

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
                        onClick={() => {
                          setSelectedDay(day.date);
                          setPanel('dia');
                          setSelectedApt(null);
                        }}
                      >
                        <span className="adm-apple-day__num">{day.dayNum ?? Number(day.date.split('-')[2])}</span>
                        {preview.length > 0 ? (
                          <span className="adm-apple-day__events">
                            {preview.map((apt) => (
                              <span
                                key={aptKey(apt)}
                                role="button"
                                tabIndex={0}
                                className={[
                                  'adm-apple-day__chip',
                                  `adm-apple-day__chip--${apt.source}`,
                                  selectedKey === aptKey(apt) ? 'is-chip-selected' : '',
                                ].join(' ')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectApt(apt);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectApt(apt);
                                  }
                                }}
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
            {selectedApt ? (
              <AppointmentDetail
                apt={selectedApt}
                deletingId={deletingId}
                onBack={() => setSelectedApt(null)}
                onRequestDelete={requestDelete}
              />
            ) : (
              <>
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
                            key={aptKey(apt)}
                            apt={apt}
                            selected={selectedKey === aptKey(apt)}
                            onSelect={handleSelectApt}
                            deletingId={deletingId}
                            onRequestDelete={requestDelete}
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
                                key={aptKey(apt)}
                                apt={apt}
                                selected={selectedKey === aptKey(apt)}
                                onSelect={handleSelectApt}
                                deletingId={deletingId}
                                onRequestDelete={requestDelete}
                              />
                            ))}
                          </section>
                        ))}
                      </div>
                    )}
                  </>
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
