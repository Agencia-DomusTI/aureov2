import { useCallback, useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { CLINICS } from '../constants/clinics';
import { BOOKING_CONFIG } from '../constants/booking';
import { createBooking, getAvailability, getBookingConfig } from '../lib/bookingApi';
import { getAllBookableServices } from '../utils/bookableServices';
import {
  generateTimeSlots,
  getTodayInMexico,
  isDateBookableOnline,
  isSundayByRequest,
} from '../utils/bookingSlots';
import 'react-day-picker/style.css';
import './BookingCalendar.css';

const STEPS = [
  { id: 'service', label: 'Servicio', icon: '◆' },
  { id: 'date', label: 'Fecha', icon: '▦' },
  { id: 'time', label: 'Horario', icon: '◷' },
  { id: 'details', label: 'Datos', icon: '◎' },
];

function dateStrToLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function localToDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateStr) {
  return dateStrToLocal(dateStr).toLocaleDateString('es-MX', {
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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const selectedService = services.find((s) => s.id === serviceId);

  const todayStr = getTodayInMexico(bookingConfig);
  const calendarFrom = dateStrToLocal(todayStr);
  const calendarTo = useMemo(() => {
    const max = dateStrToLocal(todayStr);
    max.setDate(max.getDate() + bookingConfig.maxAdvanceDays);
    return max;
  }, [todayStr, bookingConfig.maxAdvanceDays]);

  const selectedDay = selectedDate ? dateStrToLocal(selectedDate) : undefined;

  useEffect(() => {
    getBookingConfig()
      .then((data) => { if (data) setBookingConfig(data); })
      .catch(() => {});
  }, []);

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [services, serviceSearch]);

  const servicesByCategory = useMemo(() => {
    const groups = new Map();
    filteredServices.forEach((service) => {
      if (!groups.has(service.category)) groups.set(service.category, []);
      groups.get(service.category).push(service);
    });
    return groups;
  }, [filteredServices]);

  const slotGroups = useMemo(() => groupSlotsByPeriod(slots), [slots]);

  const isDayDisabled = useCallback(
    (date) => !isDateBookableOnline(localToDateStr(date), bookingConfig),
    [bookingConfig],
  );

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

  const handleDaySelect = (day) => {
    if (!day) return;
    setSelectedDate(localToDateStr(day));
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
          paymentUrl: data.paymentUrl,
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

  if (step === 4 && result) {
    return (
      <div className="bk-widget bk-widget--result">
        <div className={`bk-result bk-result--${result.type}`}>
          <div className="bk-result__ring">
            <span className="bk-result__icon">{result.type === 'success' ? '✓' : '!'}</span>
          </div>
          <h3>{result.type === 'success' ? '¡Cita solicitada!' : 'Confirma por WhatsApp'}</h3>
          <p>{result.message}</p>
          {selectedService && selectedSlot ? (
            <div className="bk-result__card">
              <strong>{selectedService.name}</strong>
              <span>{formatDateLabel(selectedDate)}</span>
              <span>{selectedSlot.label} · {selectedService.durationLabel}</span>
            </div>
          ) : null}
          {result.paymentUrl ? (
            <a href={result.paymentUrl} className="btn-primary bk-result__btn" target="_blank" rel="noopener noreferrer">
              Completar pago
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
                      {items.map((service) => (
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
                        </button>
                      ))}
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

            <div className="bk-calendar-wrap">
              <DayPicker
                mode="single"
                locale={es}
                selected={selectedDay}
                onSelect={handleDaySelect}
                disabled={isDayDisabled}
                fromDate={calendarFrom}
                toDate={calendarTo}
                showOutsideDays={false}
                className="bk-daypicker"
                classNames={{
                  month_caption: 'bk-dp-caption',
                  nav: 'bk-dp-nav',
                  button_previous: 'bk-dp-nav-btn',
                  button_next: 'bk-dp-nav-btn',
                  weekdays: 'bk-dp-weekdays',
                  weekday: 'bk-dp-weekday',
                  day: 'bk-dp-day',
                  day_button: 'bk-dp-day-btn',
                  selected: 'bk-dp-selected',
                  disabled: 'bk-dp-disabled',
                  today: 'bk-dp-today',
                }}
              />
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
              <h3>Tus datos</h3>
              <p>Último paso para confirmar tu cita.</p>
            </header>

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
              <button type="submit" className="btn-primary bk-cta" disabled={submitting}>
                {submitting ? 'Reservando…' : 'Confirmar cita'}
              </button>
            </footer>
          </form>
        )}
      </main>
    </div>
  );
};

export default BookingCalendar;
