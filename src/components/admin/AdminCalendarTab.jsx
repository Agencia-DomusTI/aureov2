import { useEffect, useMemo, useState } from 'react';

const TZ = 'America/Mexico_City';
const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

function useModalLock(onClose) {
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
}

function DeleteConfirmModal({ apt, deleting, onCancel, onConfirm }) {
  useModalLock(deleting ? null : onCancel);

  if (!apt) return null;

  const patient = apt.patientName || apt.subtitle || 'Sin paciente';

  return (
    <div className="adm-modal-overlay" role="presentation" onClick={() => { if (!deleting) onCancel(); }}>
      <div className="adm-modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal__icon" aria-hidden>!</div>
        <h3 className="adm-modal__title">¿Eliminar esta cita?</h3>
        <p className="adm-modal__desc">
          Esta acción no se puede deshacer. La cita se quitará del calendario
          {apt.source === 'site' ? ' y de las reservas del sitio' : ' de Google Calendar'}.
        </p>
        <div className="adm-modal__summary">
          <div className="adm-modal__summary-row"><span>Tratamiento</span><strong>{apt.title}</strong></div>
          <div className="adm-modal__summary-row"><span>Paciente</span><strong>{patient}</strong></div>
          <div className="adm-modal__summary-row"><span>Fecha</span><strong>{formatDateLong(apt.start)}</strong></div>
          <div className="adm-modal__summary-row"><span>Horario</span><strong>{formatTimeRange(apt.start, apt.end)}</strong></div>
        </div>
        <div className="adm-modal__actions">
          <button type="button" className="adm-modal__btn adm-modal__btn--ghost" onClick={onCancel} disabled={deleting}>Cancelar</button>
          <button type="button" className="adm-modal__btn adm-modal__btn--danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentModal({ apt, deletingId, resendingId, onClose, onRequestDelete, onResendEmail }) {
  useModalLock(apt ? onClose : null);

  if (!apt) return null;

  const waLink = apt.patientPhone ? waHref(apt.patientPhone) : null;
  const patient = apt.patientName || (apt.subtitle !== 'Sin paciente' ? apt.subtitle : '—');
  const isPaidSite = apt.source === 'site' && (apt.depositPaid || apt.paymentStatus === 'paid');
  const isResending = resendingId === apt.id;

  return (
    <div className="adm-modal-overlay" role="presentation" onClick={onClose}>
      <div className="adm-modal adm-modal--detail" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="adm-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>

        <span className={`adm-modal__badge adm-modal__badge--${apt.source}`}>
          {apt.sourceLabel ?? (apt.source === 'google' ? 'Google Calendar' : 'Reserva del sitio')}
        </span>

        <h3 className="adm-modal__title">{apt.title}</h3>
        <p className="adm-modal__when">{formatDateLong(apt.start)}</p>
        <p className="adm-modal__time">{formatTimeRange(apt.start, apt.end)}</p>

        <div className="adm-modal__summary adm-modal__summary--detail">
          <div className="adm-modal__summary-row"><span>Paciente</span><strong>{patient}</strong></div>
          <div className="adm-modal__summary-row">
            <span>Teléfono</span>
            <strong>
              {apt.patientPhone ? (
                <a href={`tel:${apt.patientPhone.replace(/\s/g, '')}`}>{apt.patientPhone}</a>
              ) : '—'}
            </strong>
          </div>
          {apt.patientEmail ? (
            <div className="adm-modal__summary-row">
              <span>Email</span>
              <strong><a href={`mailto:${apt.patientEmail}`}>{apt.patientEmail}</a></strong>
            </div>
          ) : null}
          <div className="adm-modal__summary-row"><span>Duración</span><strong>{formatDuration(getDurationMinutes(apt))}</strong></div>
          {apt.confirmationCode ? (
            <div className="adm-modal__summary-row"><span>Código</span><strong><code>{apt.confirmationCode}</code></strong></div>
          ) : null}
          {apt.depositAmountMxn > 0 ? (
            <div className="adm-modal__summary-row">
              <span>Anticipo</span>
              <strong>
                ${apt.depositAmountMxn} MXN
                {apt.depositPaid ? ' · Pagado' : apt.paymentStatus === 'pending' ? ' · Pendiente' : ''}
              </strong>
            </div>
          ) : null}
          {apt.patientNotes ? (
            <div className="adm-modal__summary-row"><span>Notas</span><strong>{apt.patientNotes}</strong></div>
          ) : null}
        </div>

        <div className="adm-modal__actions">
          {isPaidSite ? (
            <button
              type="button"
              className="adm-modal__btn adm-modal__btn--ghost"
              disabled={isResending || deletingId === apt.id}
              onClick={() => onResendEmail?.(apt)}
            >
              {isResending ? 'Enviando…' : 'Reenviar correo al doctor'}
            </button>
          ) : null}
          {waLink ? (
            <a href={waLink} className="adm-modal__btn adm-modal__btn--ghost" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          ) : null}
          {apt.canDelete ? (
            <button
              type="button"
              className="adm-modal__btn adm-modal__btn--danger"
              disabled={deletingId === apt.id}
              onClick={() => onRequestDelete(apt)}
            >
              {deletingId === apt.id ? 'Eliminando…' : 'Eliminar cita'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const AdminCalendarTab = ({
  status,
  statusError,
  monthOffset = 0,
  refreshing = false,
  deletingId = null,
  resendingId = null,
  onRangeChange,
  onRefresh,
  onDelete,
  onResendEmail,
}) => {
  const [modalApt, setModalApt] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarDays = status?.weekDays ?? [];

  const weekRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  const monthTitle = status?.rangeLabel ?? calendarDays[0]?.monthLabel ?? 'Calendario';

  const inMonthDays = useMemo(
    () => calendarDays.filter((d) => d.inMonth !== false),
    [calendarDays],
  );

  useEffect(() => {
    if (!inMonthDays.length) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate((current) => {
      if (current && inMonthDays.some((d) => d.date === current)) return current;
      const today = inMonthDays.find((d) => d.isToday);
      if (today) return today.date;
      const firstWithEvents = inMonthDays.find((d) => (d.count ?? 0) > 0);
      return (firstWithEvents ?? inMonthDays[0]).date;
    });
  }, [inMonthDays]);

  const selectedDay = useMemo(
    () => calendarDays.find((d) => d.date === selectedDate) ?? null,
    [calendarDays, selectedDate],
  );

  const selectedAppointments = useMemo(() => {
    const list = selectedDay?.appointments ?? [];
    return [...list].sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [selectedDay]);

  const selectedDayLabel = selectedDay
    ? formatDateLong(`${selectedDay.date}T12:00:00`)
    : '';

  const requestDelete = (apt) => {
    setModalApt(null);
    setPendingDelete(apt);
  };

  const cancelDelete = () => {
    if (!deletingId) setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await onDelete?.(pendingDelete);
      setPendingDelete(null);
    } catch {
      /* AdminPanel muestra alert */
    }
  };

  const goToday = () => onRangeChange?.({ monthOffset: 0 });

  return (
    <div className="adm-dash adm-dash--apple">
      <DeleteConfirmModal
        apt={pendingDelete}
        deleting={Boolean(pendingDelete && deletingId === pendingDelete.id)}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      <AppointmentModal
        apt={modalApt}
        deletingId={deletingId}
        resendingId={resendingId}
        onClose={() => setModalApt(null)}
        onRequestDelete={requestDelete}
        onResendEmail={onResendEmail}
      />

      {statusError ? <p className="admin-toast admin-toast--err">{statusError}</p> : null}

      <section className="adm-apple-cal adm-apple-cal--month">
        <header className="adm-apple-cal__head">
          <div className="adm-apple-cal__title">
            <strong>{monthTitle}</strong>
            <span>{status?.stats?.range ?? 0} citas este mes</span>
          </div>

          <div className="adm-apple-cal__controls">
            <button
              type="button"
              className="adm-apple-cal__chev"
              onClick={() => onRangeChange?.({ monthOffset: monthOffset - 1 })}
              disabled={refreshing}
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="adm-apple-cal__today"
              onClick={goToday}
              disabled={refreshing || monthOffset === 0}
            >
              Hoy
            </button>
            <button
              type="button"
              className="adm-apple-cal__chev"
              onClick={() => onRangeChange?.({ monthOffset: monthOffset + 1 })}
              disabled={refreshing}
              aria-label="Mes siguiente"
            >
              ›
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

        <div className="adm-apple-layout adm-apple-layout--split">
          <div className="adm-apple-month">
            <div className="adm-apple-weekdays">
              {WEEK_HEADERS.map((h) => <span key={h}>{h}</span>)}
            </div>

            <div className="adm-apple-grid-body">
              {weekRows.map((row, wi) => (
                <div key={wi} className="adm-apple-week">
                  {row.map((day) => {
                    const preview = day.appointments?.slice(0, 3) ?? [];
                    const extra = Math.max(0, (day.count ?? 0) - preview.length);
                    const isSelectable = day.inMonth !== false;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={[
                          'adm-apple-day',
                          day.inMonth === false ? 'is-outside' : '',
                          day.isToday ? 'is-today' : '',
                          day.count > 0 ? 'has-events' : '',
                          day.date === selectedDate ? 'is-selected' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => { if (isSelectable) setSelectedDate(day.date); }}
                        disabled={!isSelectable}
                      >
                        <span className="adm-apple-day__num">{day.dayNum}</span>
                        {preview.length > 0 ? (
                          <div className="adm-apple-day__events">
                            {preview.map((apt) => (
                              <span
                                key={aptKey(apt)}
                                className={[
                                  'adm-apple-day__chip',
                                  `adm-apple-day__chip--${apt.source}`,
                                ].join(' ')}
                              >
                                {formatTime(apt.start)}{' '}
                                {apt.patientName || (apt.subtitle !== 'Sin paciente' ? apt.subtitle : apt.title)}
                              </span>
                            ))}
                            {extra > 0 ? <span className="adm-apple-day__more">+{extra} más</span> : null}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <aside className="adm-apple-side">
            <div className="adm-apple-side__head">
              <h3>{selectedDayLabel || 'Selecciona un día'}</h3>
              <span>
                {selectedAppointments.length
                  ? `${selectedAppointments.length} cita${selectedAppointments.length === 1 ? '' : 's'}`
                  : ''}
              </span>
            </div>

            {selectedAppointments.length === 0 ? (
              <p className="adm-apple-empty">
                {selectedDay ? 'Sin citas este día.' : 'Elige un día del calendario para ver sus citas.'}
              </p>
            ) : (
              <div className="adm-apple-events">
                {selectedAppointments.map((apt) => {
                  const patient = apt.patientName
                    || (apt.subtitle && apt.subtitle !== 'Sin paciente' ? apt.subtitle : null);
                  return (
                    <button
                      key={aptKey(apt)}
                      type="button"
                      className={[
                        'adm-event',
                        `adm-event--${apt.source}`,
                        apt.source === 'site' && apt.paymentStatus === 'pending' && !apt.depositPaid
                          ? 'adm-event--pending'
                          : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setModalApt(apt)}
                    >
                      <span className="adm-event__stripe" aria-hidden />
                      <span className="adm-event__body">
                        <span className="adm-event__top">
                          <span className="adm-event__time">{formatTimeRange(apt.start, apt.end)}</span>
                          <span className="adm-event__badge">
                            {apt.source === 'google'
                              ? 'Google'
                              : apt.paymentStatus === 'pending' && !apt.depositPaid
                                ? 'Pago pendiente'
                                : 'Sitio'}
                          </span>
                        </span>
                        <span className="adm-event__title">{apt.title}</span>
                        {patient ? <span className="adm-event__service">{patient}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default AdminCalendarTab;
