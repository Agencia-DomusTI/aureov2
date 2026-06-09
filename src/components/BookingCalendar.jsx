import { useCallback, useEffect, useMemo, useState } from 'react';
import { CLINICS } from '../constants/clinics';
import { BOOKING_CONFIG } from '../constants/booking';
import { createBooking, getAvailability, getBookingConfig } from '../lib/bookingApi';
import { getAllBookableServices } from '../utils/bookableServices';
import { formatDepositLabel, getDepositForService } from '../utils/deposit';
import {
  generateTimeSlots,
  getMonthDays,
  getTodayInMexico,
  isSundayByRequest,
} from '../utils/bookingSlots';
import './BookingCalendar.css';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STEPS = [
  { id: 'service', label: 'Servicio', icon: '◆' },
  { id: 'date', label: 'Fecha', icon: '▦' },
  { id: 'time', label: 'Horario', icon: '◷' },
  { id: 'details', label: 'Datos', icon: '◎' },
];

function getInitialMonth(config) {
  const today = getTodayInMexico(config);
  const [y, m] = today.split('-').map(Number);
  return { year: y, month: m - 1 };
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: BOOKING_CONFIG.timezone,
  });
}

function groupSlotsByPeriod(slots) {
  const morning = [];
  const afternoon = [];
  slots.forEach((slot) => {
    const hour = Number(
      new Date(slot.start).toLocaleString('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: BOOKING_CONFIG.timezone,
      }),
    );
    if (hour < 14) morning.push(slot);
    else afternoon.push(slot);
  });
  return { morning, afternoon };
}

const BookingCalendar = () => {
  const services = useMemo(() => getAllBookableServices(), []);
  const [bookingConfig, setBookingConfig] = useState(BOOKING_CONFIG);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [month, setMonth] = useState(() => getInitialMonth(BOOKING_CONFIG));
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const servicesConfig = bookingConfig.servicesConfig ?? {};

  const visibleServices = useMemo(() => {
    return services
      .filter((s) => servicesConfig[s.id]?.active !== false)
      .map((s) => ({
        ...s,
        price: servicesConfig[s.id]?.priceLabel ?? s.price,
      }));
  }, [services, servicesConfig]);

  const selectedService = visibleServices.find((s) => s.id === serviceId);
  const selectedDeposit = selectedService
    ? getDepositForService(selectedService.id, bookingConfig)
    : null;
  const todayStr = getTodayInMexico(bookingConfig);

  const monthDays = useMemo(
    () => getMonthDays(month.year, month.month, bookingConfig),
    [month.year, month.month, bookingConfig],
  );

  const firstWeekday = useMemo(
    () => new Date(Date.UTC(month.year, month.month, 1)).getUTCDay(),
    [month.year, month.month],
  );

  useEffect(() => {
    getBookingConfig()
      .then((data) => { if (data) setBookingConfig(data); })
      .catch(() => {});
  }, []);

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return visibleServices;
    return visibleServices.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [visibleServices, serviceSearch]);

  const servicesByCategory = useMemo(() => {
    const groups = new Map();
    filteredServices.forEach((service) => {
      if (!groups.has(service.category)) groups.set(service.category, []);
      groups.get(service.category).push(service);
    });
    return groups;
  }, [filteredServices]);

  const slotGroups = useMemo(() => groupSlotsByPeriod(slots), [slots]);

  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    let busy = [];
    try {
      const data = await getAvailability(selectedDate, selectedService.durationMinutes);
      busy = data.busy ?? [];
    } catch {
      /* sin Supabase: solo horario de clínica */
    }

    setSlots(generateTimeSlots(selectedDate, selectedService.durationMinutes, busy, bookingConfig));
    setLoadingSlots(false);
  }, [selectedDate, selectedService, bookingConfig]);

  useEffect(() => {
    if (step === 2) loadSlots();
  }, [step, loadSlots]);

  const changeMonth = (delta) => {
    setMonth((prev) => {
      let { year, month: m } = prev;
      m += delta;
      if (m < 0) { m = 11; year -= 1; }
      if (m > 11) { m = 0; year += 1; }
      return { year, month: m };
    });
  };

  const pickDate = (dateStr, bookable) => {
    if (!bookable) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    setSubmitting(true);
    setResult(null);

    const payload = {
      service: selectedService.name,
      durationMinutes: selectedService.durationMinutes,
      start: selectedSlot.start,
      end: selectedSlot.end,
      patient: form,
      timezone: BOOKING_CONFIG.timezone,
    };

    try {
      const data = await createBooking(payload);

      if (data.success) {
        setResult({
          type: 'success',
          message: data.message,
          confirmationCode: data.confirmationCode,
          paymentUrl: data.paymentUrl,
          depositAmountMxn: data.depositAmountMxn,
          paymentRequired: data.paymentRequired,
        });
        setStep(4);
        return;
      }

      throw new Error(data.message || 'No se pudo confirmar la cita');
    } catch (err) {
      const dateLabel = formatDateLabel(selectedDate);
      const waText = [
        'Hola Áureo Clinique, quiero agendar una cita:',
        `Servicio: ${selectedService.name}`,
        `Fecha: ${dateLabel}`,
        `Hora: ${selectedSlot.label}`,
        `Nombre: ${form.name}`,
        `Tel: ${form.phone}`,
        form.email ? `Email: ${form.email}` : '',
        form.notes ? `Notas: ${form.notes}` : '',
      ].filter(Boolean).join('\n');

      setResult({
        type: 'fallback',
        message: err.message || 'Confirma tu cita por WhatsApp mientras activamos el calendario.',
        waHref: `https://wa.me/${CLINICS.qro.phoneWa}?text=${encodeURIComponent(waText)}`,
      });
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setServiceId('');
    setServiceSearch('');
    setMonth(getInitialMonth(bookingConfig));
    setSelectedDate('');
    setSelectedSlot(null);
    setSlots([]);
    setResult(null);
    setForm({ name: '', phone: '', email: '', notes: '' });
  };

  const goToStep = (index) => {
    if (index < step) setStep(index);
  };

  const renderSlotGroup = (label, items) => {
    if (!items.length) return null;
    return (
      <div className="bk-slots-group">
        <p className="bk-slots-group__label">{label}</p>
        <div className="bk-slots">
          {items.map((slot) => (
            <button
              key={slot.start}
              type="button"
              className={`bk-slot ${selectedSlot?.start === slot.start ? 'is-selected' : ''}`}
              onClick={() => setSelectedSlot(slot)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard no disponible */
    }
  };

  if (step === 4 && result) {
    return (
      <div className="bk-widget bk-widget--result">
        <div className={`bk-result bk-result--${result.type}`}>
          <div className="bk-result__ring">
            <span className="bk-result__icon">{result.type === 'success' ? '✓' : '!'}</span>
          </div>
          <h3>{result.type === 'success' ? '¡Cita confirmada!' : 'Confirma por WhatsApp'}</h3>
          {result.confirmationCode ? (
            <div className="bk-result__code">
              <span className="bk-result__code-label">Código de confirmación</span>
              <button
                type="button"
                className="bk-result__code-value"
                onClick={() => copyCode(result.confirmationCode)}
                title="Copiar código"
              >
                {result.confirmationCode}
              </button>
              <span className="bk-result__code-hint">Toca el código para copiarlo</span>
            </div>
          ) : null}
          <p>{result.message}</p>
          {result.type === 'success' ? (
            <p className="bk-result__wa-hint">
              Te enviaremos un mensaje de confirmación al WhatsApp que indicaste.
            </p>
          ) : null}
          {selectedService && selectedSlot ? (
            <div className="bk-result__card">
              <strong>{selectedService.name}</strong>
              <span>{formatDateLabel(selectedDate)}</span>
              <span>{selectedSlot.label} · {selectedService.durationLabel}</span>
              {result.depositAmountMxn > 0 ? (
                <span>Anticipo: ${result.depositAmountMxn} MXN</span>
              ) : (
                <span>Sin anticipo</span>
              )}
            </div>
          ) : null}
          {result.paymentUrl ? (
            <a href={result.paymentUrl} className="btn-primary bk-result__btn" target="_blank" rel="noopener noreferrer">
              Pagar anticipo{result.depositAmountMxn ? ` · $${result.depositAmountMxn} MXN` : ''}
            </a>
          ) : null}
          {result.waHref ? (
            <a href={result.waHref} className="btn-primary bk-result__btn" target="_blank" rel="noopener noreferrer">
              Confirmar en WhatsApp
            </a>
          ) : null}
          <button type="button" className="bk-result__reset" onClick={reset}>
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-widget">
      <aside className="bk-aside">
        <div className="bk-aside__brand">
          <img src="/logosin.png" alt="" className="bk-aside__logo" />
          <div>
            <strong>Áureo Clinique</strong>
            <span>Querétaro · Valoración y tratamientos</span>
          </div>
        </div>

        <nav className="bk-progress" aria-label="Pasos de reservación">
          {STEPS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`bk-progress__item ${i === step ? 'is-current' : ''} ${i < step ? 'is-done' : ''}`}
              onClick={() => goToStep(i)}
              disabled={i > step}
            >
              <span className="bk-progress__dot">{i < step ? '✓' : item.icon}</span>
              <span className="bk-progress__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="bk-summary">
          <p className="bk-summary__title">Tu cita</p>
          <dl className="bk-summary__list">
            <div className={`bk-summary__row ${selectedService ? 'is-filled' : ''}`}>
              <dt>Servicio</dt>
              <dd>{selectedService?.name ?? '—'}</dd>
            </div>
            <div className={`bk-summary__row ${selectedDate ? 'is-filled' : ''}`}>
              <dt>Fecha</dt>
              <dd>{selectedDate ? formatDateLabel(selectedDate) : '—'}</dd>
            </div>
            <div className={`bk-summary__row ${selectedSlot ? 'is-filled' : ''}`}>
              <dt>Horario</dt>
              <dd>{selectedSlot?.label ?? '—'}</dd>
            </div>
          </dl>
          {selectedService ? (
            <p className="bk-summary__meta">
              {selectedService.durationLabel}
              {selectedService.price ? ` · ${selectedService.price.split('·')[0].trim()}` : ''}
              {selectedDeposit !== null ? ` · ${formatDepositLabel(selectedDeposit)}` : ''}
            </p>
          ) : null}
        </div>

        <p className="bk-aside__hours">{bookingConfig.scheduleSummary}</p>
        <p className="bk-aside__tz">{bookingConfig.timezoneLabel ?? BOOKING_CONFIG.timezoneLabel}</p>
      </aside>

      <main className="bk-main">
        {step === 0 && (
          <section className="bk-panel" key="service">
            <header className="bk-panel__head">
              <h3>Elige tu servicio</h3>
              <p>Selecciona el tratamiento o valoración que deseas agendar.</p>
            </header>

            <div className="bk-search-wrap">
              <input
                type="search"
                className="bk-search"
                placeholder="Buscar tratamiento…"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                aria-label="Buscar servicio"
              />
            </div>

            <div className="bk-services">
              {filteredServices.length === 0 ? (
                <p className="bk-empty">No encontramos ese servicio. Prueba otra búsqueda.</p>
              ) : (
                [...servicesByCategory.entries()].map(([category, items]) => (
                  <div key={category} className="bk-service-group">
                    <h4 className="bk-service-group__title">{category}</h4>
                    <div className="bk-service-grid">
                      {items.map((service) => {
                        const deposit = getDepositForService(service.id, bookingConfig);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            className={`bk-service-card ${serviceId === service.id ? 'is-selected' : ''}`}
                            onClick={() => setServiceId(service.id)}
                          >
                            <span className="bk-service-card__name">{service.name}</span>
                            <span className="bk-service-card__meta">
                              {service.durationLabel}
                              {service.price ? ` · ${service.price.split('·')[0].trim()}` : ''}
                            </span>
                            <span className="bk-service-card__deposit">{formatDepositLabel(deposit)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="bk-panel__foot">
              <button
                type="button"
                className="btn-primary bk-cta"
                disabled={!serviceId}
                onClick={() => setStep(1)}
              >
                Continuar
              </button>
            </footer>
          </section>
        )}

        {step === 1 && selectedService && (
          <section className="bk-panel" key="date">
            <header className="bk-panel__head">
              <h3>Selecciona una fecha</h3>
              <p>{selectedService.name} · {selectedService.durationLabel}</p>
            </header>

            <div className="bk-cal">
              <div className="bk-cal__nav">
                <button type="button" className="bk-cal__arrow" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button>
                <strong>{MONTHS[month.month]} {month.year}</strong>
                <button type="button" className="bk-cal__arrow" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button>
              </div>
              <div className="bk-cal__weekdays">
                {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
              </div>
              <div className="bk-cal__days">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <span key={`pad-${i}`} className="bk-cal__day bk-cal__day--pad" aria-hidden />
                ))}
                {monthDays.map(({ dateStr, day, bookable, sunday }) => (
                  <button
                    key={dateStr}
                    type="button"
                    className={`bk-cal__day ${selectedDate === dateStr ? 'is-selected' : ''} ${!bookable ? 'is-disabled' : ''} ${dateStr === todayStr ? 'is-today' : ''} ${sunday ? 'is-sunday' : ''}`}
                    disabled={!bookable}
                    onClick={() => pickDate(dateStr, bookable)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <p className="bk-note">
              <span className="bk-note__icon">ℹ</span>
              Domingos disponibles solo con cita previa por WhatsApp.
            </p>

            <footer className="bk-panel__foot bk-panel__foot--split">
              <button type="button" className="bk-back" onClick={() => setStep(0)}>← Servicio</button>
            </footer>
          </section>
        )}

        {step === 2 && selectedService && selectedDate && (
          <section className="bk-panel" key="time">
            <header className="bk-panel__head">
              <h3>Elige un horario</h3>
              <p className="bk-panel__capitalize">{formatDateLabel(selectedDate)}</p>
            </header>

            {isSundayByRequest(selectedDate) ? (
              <p className="bk-empty">Domingo: contáctanos por WhatsApp para coordinar.</p>
            ) : loadingSlots ? (
              <div className="bk-loading">
                <span className="bk-loading__spinner" />
                Consultando disponibilidad…
              </div>
            ) : slots.length === 0 ? (
              <p className="bk-empty">No hay horarios disponibles este día. Elige otra fecha.</p>
            ) : (
              <div className="bk-slots-wrap">
                {renderSlotGroup('Mañana', slotGroups.morning)}
                {renderSlotGroup('Tarde', slotGroups.afternoon)}
              </div>
            )}

            <footer className="bk-panel__foot bk-panel__foot--split">
              <button type="button" className="bk-back" onClick={() => setStep(1)}>← Fecha</button>
              <button
                type="button"
                className="btn-primary bk-cta"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continuar
              </button>
            </footer>
          </section>
        )}

        {step === 3 && selectedService && selectedSlot && (
          <form className="bk-panel bk-form" key="details" onSubmit={handleSubmit}>
            <header className="bk-panel__head">
              <h3>Confirma tu cita</h3>
              <p>Último paso — te contactamos por WhatsApp al confirmar.</p>
            </header>

            <div className="bk-confirm-summary">
              <div className="bk-confirm-summary__row">
                <span>Servicio</span>
                <strong>{selectedService.name}</strong>
              </div>
              <div className="bk-confirm-summary__row">
                <span>Fecha</span>
                <strong className="bk-panel__capitalize">{formatDateLabel(selectedDate)}</strong>
              </div>
              <div className="bk-confirm-summary__row">
                <span>Horario</span>
                <strong>{selectedSlot.label} · {selectedService.durationLabel}</strong>
              </div>
              <div className="bk-confirm-summary__row">
                <span>Anticipo</span>
                <strong>
                  {selectedDeposit > 0
                    ? `$${selectedDeposit} MXN`
                    : 'No aplica'}
                </strong>
              </div>
            </div>

            <div className="bk-form-card">
              <div className="bk-form-row">
                <label className="bk-label" htmlFor="bk-name">Nombre completo *</label>
                <input
                  id="bk-name"
                  className="bk-input"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="bk-form-row">
                <label className="bk-label" htmlFor="bk-phone">Teléfono / WhatsApp *</label>
                <input
                  id="bk-phone"
                  className="bk-input"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="bk-form-row">
                <label className="bk-label" htmlFor="bk-email">Email</label>
                <input
                  id="bk-email"
                  className="bk-input"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="bk-form-row">
                <label className="bk-label" htmlFor="bk-notes">Notas (opcional)</label>
                <textarea
                  id="bk-notes"
                  className="bk-input bk-textarea"
                  rows={3}
                  placeholder="Alergias, preferencias, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <footer className="bk-panel__foot bk-panel__foot--split">
              <button type="button" className="bk-back" onClick={() => setStep(2)}>← Horario</button>
              <button type="submit" className="btn-primary bk-cta bk-cta--confirm" disabled={submitting}>
                {submitting ? 'Confirmando…' : 'Confirmar mi cita'}
              </button>
            </footer>
          </form>
        )}
      </main>
    </div>
  );
};

export default BookingCalendar;
