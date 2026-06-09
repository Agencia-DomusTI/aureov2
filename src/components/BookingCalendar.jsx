import { useCallback, useEffect, useMemo, useState } from 'react';
import { CLINICS } from '../constants/clinics';
import { BOOKING_CONFIG } from '../constants/booking';
import { createBooking, getAvailability, getBookingConfig } from '../lib/bookingApi';
import { getAllBookableServices } from '../utils/bookableServices';
import { generateTimeSlots, getMonthDays, getTodayInMexico, isSundayByRequest } from '../utils/bookingSlots';
import './BookingCalendar.css';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STEPS = ['Servicio', 'Fecha', 'Horario', 'Datos'];

function getInitialMonth(config) {
  const today = getTodayInMexico(config);
  const [y, m] = today.split('-').map(Number);
  return { year: y, month: m - 1 };
}

const BookingCalendar = () => {
  const services = useMemo(() => getAllBookableServices(), []);
  const [bookingConfig, setBookingConfig] = useState(BOOKING_CONFIG);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [month, setMonth] = useState(() => getInitialMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });

  const selectedService = services.find((s) => s.id === serviceId);

  useEffect(() => {
    getBookingConfig()
      .then((data) => { if (data) setBookingConfig(data); })
      .catch(() => {});
  }, []);

  const monthDays = useMemo(
    () => getMonthDays(month.year, month.month, bookingConfig),
    [month.year, month.month, bookingConfig],
  );

  const firstWeekday = useMemo(() => {
    return new Date(Date.UTC(month.year, month.month, 1)).getUTCDay();
  }, [month.year, month.month]);

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
    setSelectedDate('');
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
      const dateLabel = new Date(selectedSlot.start).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: BOOKING_CONFIG.timezone,
      });
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
    setSelectedDate('');
    setSelectedSlot(null);
    setSlots([]);
    setResult(null);
    setForm({ name: '', phone: '', email: '', notes: '' });
  };

  if (step === 4 && result) {
    return (
      <div className="booking-calendar booking-calendar--result">
        <div className={`booking-result booking-result--${result.type}`}>
          <span className="booking-result__icon">{result.type === 'success' ? '✓' : '!'}</span>
          <h3>{result.type === 'success' ? 'Cita solicitada' : 'Confirma por WhatsApp'}</h3>
          <p>{result.message}</p>
          {result.waHref ? (
            <a href={result.waHref} className="btn-primary booking-result__btn" target="_blank" rel="noopener noreferrer">
              Confirmar en WhatsApp
            </a>
          ) : null}
          <button type="button" className="booking-result__reset" onClick={reset}>
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-calendar">
      <div className="booking-calendar__header">
        <p className="booking-calendar__hours">{bookingConfig.scheduleSummary}</p>
        <p className="booking-calendar__tz">{bookingConfig.timezoneLabel ?? BOOKING_CONFIG.timezoneLabel}</p>
      </div>

      <div className="booking-steps" aria-label="Pasos de reservación">
        {STEPS.map((label, i) => (
          <div key={label} className={`booking-step ${i <= step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
            <span className="booking-step__num">{i + 1}</span>
            <span className="booking-step__label">{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="booking-panel">
          <label className="booking-label" htmlFor="booking-service">Selecciona el servicio</label>
          <select
            id="booking-service"
            className="booking-select"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">— Elige un tratamiento —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationLabel}
              </option>
            ))}
          </select>
          {selectedService ? (
            <p className="booking-service-meta">
              <span>{selectedService.category}</span>
              <span>Duración: {selectedService.durationLabel}</span>
              {selectedService.price ? <span>{selectedService.price.split('·')[0].trim()}</span> : null}
            </p>
          ) : null}
          <button
            type="button"
            className="btn-primary booking-next"
            disabled={!serviceId}
            onClick={() => setStep(1)}
          >
            Continuar
          </button>
        </div>
      )}

      {step === 1 && selectedService && (
        <div className="booking-panel">
          <div className="booking-month-nav">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">‹</button>
            <strong>{MONTHS[month.month]} {month.year}</strong>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">›</button>
          </div>
          <div className="booking-weekdays">
            {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="booking-days">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`pad-${i}`} className="booking-day booking-day--pad" />
            ))}
            {monthDays.map(({ dateStr, day, bookable, sunday }) => (
              <button
                key={dateStr}
                type="button"
                className={`booking-day ${selectedDate === dateStr ? 'is-selected' : ''} ${!bookable ? 'is-disabled' : ''} ${sunday ? 'is-sunday' : ''}`}
                disabled={!bookable}
                title={sunday ? 'Domingo: cita previa por WhatsApp' : undefined}
                onClick={() => { setSelectedDate(dateStr); setStep(2); }}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="booking-sunday-note">
            Domingos disponibles <strong>solo con cita previa</strong> — escríbenos por WhatsApp.
          </p>
          <button type="button" className="booking-back" onClick={() => setStep(0)}>← Servicio</button>
        </div>
      )}

      {step === 2 && selectedService && selectedDate && (
        <div className="booking-panel">
          <p className="booking-panel__summary">
            {selectedService.name} ·{' '}
            {new Date(`${selectedDate}T12:00:00-06:00`).toLocaleDateString('es-MX', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
          {isSundayByRequest(selectedDate) ? (
            <p className="booking-empty">Domingo: contacta por WhatsApp para coordinar.</p>
          ) : loadingSlots ? (
            <p className="booking-loading">Consultando disponibilidad…</p>
          ) : slots.length === 0 ? (
            <p className="booking-empty">No hay horarios disponibles este día. Elige otra fecha.</p>
          ) : (
            <div className="booking-slots">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  className={`booking-slot ${selectedSlot?.start === slot.start ? 'is-selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
          <div className="booking-panel__actions">
            <button type="button" className="booking-back" onClick={() => setStep(1)}>← Fecha</button>
            <button
              type="button"
              className="btn-primary booking-next"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedService && selectedSlot && (
        <form className="booking-panel booking-form" onSubmit={handleSubmit}>
          <p className="booking-panel__summary">
            {selectedService.name} · {selectedSlot.label} · {selectedService.durationLabel}
          </p>
          <label className="booking-label" htmlFor="bk-name">Nombre completo *</label>
          <input id="bk-name" className="booking-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="booking-label" htmlFor="bk-phone">Teléfono / WhatsApp *</label>
          <input id="bk-phone" className="booking-input" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="booking-label" htmlFor="bk-email">Email</label>
          <input id="bk-email" className="booking-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="booking-label" htmlFor="bk-notes">Notas (opcional)</label>
          <textarea id="bk-notes" className="booking-input booking-textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="booking-panel__actions">
            <button type="button" className="booking-back" onClick={() => setStep(2)}>← Horario</button>
            <button type="submit" className="btn-primary booking-next" disabled={submitting}>
              {submitting ? 'Reservando…' : 'Confirmar cita'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookingCalendar;
