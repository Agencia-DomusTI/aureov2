import { useMemo } from 'react';

function formatMxn(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function BarChart({ items, valueKey = 'value', labelKey = 'label', formatValue }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);

  return (
    <div className="adm-chart adm-chart--bars" role="img" aria-hidden>
      {items.map((item) => {
        const pct = Math.round((item[valueKey] / max) * 100);
        const display = formatValue ? formatValue(item[valueKey]) : item[valueKey];
        return (
          <div key={item[labelKey]} className="adm-chart__row">
            <span className="adm-chart__label">{item[labelKey]}</span>
            <div className="adm-chart__track">
              <div
                className="adm-chart__fill"
                style={{ width: `${Math.max(pct, item[valueKey] > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="adm-chart__value">{display}</span>
          </div>
        );
      })}
    </div>
  );
}

function ColumnChart({ items, valueKey = 'value', labelKey = 'label' }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);

  return (
    <div className="adm-chart adm-chart--columns" role="img" aria-hidden>
      {items.map((item) => {
        const pct = Math.round((item[valueKey] / max) * 100);
        return (
          <div key={item[labelKey]} className="adm-chart__col">
            <span className="adm-chart__col-value">{item[valueKey]}</span>
            <div className="adm-chart__col-track">
              <div
                className="adm-chart__col-fill"
                style={{ height: `${Math.max(pct, item[valueKey] > 0 ? 6 : 0)}%` }}
              />
            </div>
            <span className="adm-chart__col-label">{item[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function PaymentRing({ paid, pending, total }) {
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="adm-pay-ring">
      <div
        className="adm-pay-ring__circle"
        style={{ '--pct': paidPct }}
        aria-hidden
      >
        <span className="adm-pay-ring__num">{paidPct}%</span>
      </div>
      <ul className="adm-pay-ring__legend">
        <li>
          <span className="adm-pay-ring__dot adm-pay-ring__dot--paid" />
          Pagadas <strong>{paid}</strong>
        </li>
        <li>
          <span className="adm-pay-ring__dot adm-pay-ring__dot--pending" />
          Pendientes <strong>{pending}</strong>
        </li>
        <li>
          <span className="adm-pay-ring__dot adm-pay-ring__dot--total" />
          Total <strong>{total}</strong>
        </li>
      </ul>
    </div>
  );
}

const AdminAnalyticsTab = ({
  status,
  statusError,
  refreshing,
  resendingAll = false,
  resendingId = null,
  onRefresh,
  onGoCalendar,
  onResendAllPaid,
  onResendBooking,
}) => {
  const paidBookings = (status?.bookings ?? []).filter(
    (b) => b.depositPaid || b.paymentStatus === 'paid',
  );
  const analytics = status?.analytics;
  const rangeLabel = status?.rangeLabel ?? 'Este mes';

  const trendData = useMemo(() => {
    const trend = analytics?.monthlyTrend ?? [];
    return trend.map((m) => ({
      label: m.label?.split(' ')[0]?.slice(0, 3) ?? m.key,
      value: m.bookings,
    }));
  }, [analytics]);

  const serviceData = useMemo(() => {
    const list = analytics?.topServices ?? status?.topServices ?? [];
    return list.map((s) => ({
      label: s.name.length > 28 ? `${s.name.slice(0, 26)}…` : s.name,
      value: s.count,
      fullName: s.name,
    }));
  }, [analytics, status]);

  const weekdayData = useMemo(() => {
    const days = analytics?.byWeekday ?? [];
    return days.map((d) => ({ label: d.day, value: d.count }));
  }, [analytics]);

  const totals = analytics?.totals ?? {
    allTime: status?.bookings?.length ?? 0,
    thisMonth: (status?.stats?.fromSite ?? 0) + (status?.stats?.fromGoogle ?? 0),
    sitePaidThisMonth: status?.stats?.fromSite ?? 0,
    fromGoogle: status?.stats?.fromGoogle ?? 0,
    upcoming: 0,
    paid: 0,
    pending: 0,
    revenueMxn: 0,
    conversionRate: 0,
    googleInRange: 0,
  };

  const todayCount = status?.stats?.today ?? 0;
  const sitePaidMonth = totals.sitePaidThisMonth ?? status?.stats?.fromSite ?? 0;
  const googleMonth = totals.fromGoogle ?? status?.stats?.fromGoogle ?? 0;
  const googleConnected = status?.calendar?.connected && !status?.calendar?.needsReauth;

  return (
    <div className="adm-dash adm-dash--apple adm-analytics">
      {statusError ? <p className="admin-toast admin-toast--err">{statusError}</p> : null}

      <header className="adm-analytics__head">
        <div>
          <h2 className="adm-analytics__title">Resumen</h2>
          <p className="adm-analytics__sub">
            {rangeLabel} · {totals.thisMonth} citas
            {googleConnected
              ? ` (${sitePaidMonth} sitio pagadas · ${googleMonth} Google)`
              : ` (${sitePaidMonth} del sitio)`}
          </p>
        </div>
        <div className="adm-analytics__actions">
          <button
            type="button"
            className="adm-apple-cal__refresh"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Actualizar"
          >
            {refreshing ? '…' : '↻'}
          </button>
          <button type="button" className="adm-analytics__link" onClick={onGoCalendar}>
            Ver calendario →
          </button>
        </div>
      </header>

      <section className="adm-stats adm-stats--analytics">
        <article className="adm-stat">
          <span className="adm-stat__num">{todayCount}</span>
          <span className="adm-stat__label">Citas hoy</span>
        </article>
        <article className="adm-stat">
          <span className="adm-stat__num">{totals.thisMonth}</span>
          <span className="adm-stat__label">Este mes</span>
          <span className="adm-stat__sub">
            {totals.upcoming} próximas
            {googleMonth > 0 ? ` · ${googleMonth} Google` : ''}
          </span>
        </article>
        <article className="adm-stat">
          <span className="adm-stat__num">{formatMxn(totals.revenueMxn)}</span>
          <span className="adm-stat__label">Anticipos cobrados</span>
        </article>
        <article className="adm-stat">
          <span className="adm-stat__num">{totals.allTime}</span>
          <span className="adm-stat__label">Reservas del sitio</span>
          <span className="adm-stat__sub">
            {totals.conversionRate}% pagadas
            {(totals.googleInRange ?? 0) > 0 ? ` · ${totals.googleInRange} en Google (6 meses)` : ''}
          </span>
        </article>
      </section>

      <div className="adm-analytics__grid">
        <section className="adm-panel-card">
          <h3 className="adm-panel-card__title">Citas por mes</h3>
          <p className="adm-panel-card__desc">Últimos 6 meses (sitio pagadas + Google)</p>
          {trendData.some((t) => t.value > 0) ? (
            <ColumnChart items={trendData} valueKey="value" labelKey="label" />
          ) : (
            <p className="adm-panel-card__empty">Aún no hay datos suficientes.</p>
          )}
        </section>

        <section className="adm-panel-card">
          <h3 className="adm-panel-card__title">Pagos de anticipo</h3>
          <p className="adm-panel-card__desc">Estado de todas las reservas registradas</p>
          <PaymentRing
            paid={totals.paid}
            pending={totals.pending}
            total={totals.allTime}
          />
        </section>

        <section className="adm-panel-card adm-panel-card--wide">
          <h3 className="adm-panel-card__title">Servicios más reservados</h3>
          <p className="adm-panel-card__desc">Sitio pagadas y citas de Google Calendar</p>
          {serviceData.length > 0 ? (
            <BarChart items={serviceData} valueKey="value" labelKey="label" />
          ) : (
            <p className="adm-panel-card__empty">Sin reservas todavía.</p>
          )}
        </section>

        <section className="adm-panel-card">
          <h3 className="adm-panel-card__title">Días con más citas</h3>
          <p className="adm-panel-card__desc">Sitio pagadas + Google en {rangeLabel}</p>
          {weekdayData.some((d) => d.value > 0) ? (
            <ColumnChart items={weekdayData} valueKey="value" labelKey="label" />
          ) : (
            <p className="adm-panel-card__empty">Sin citas este mes.</p>
          )}
        </section>

        <section className="adm-panel-card">
          <h3 className="adm-panel-card__title">Ingresos por mes</h3>
          <p className="adm-panel-card__desc">Anticipos confirmados en Stripe</p>
          {(analytics?.monthlyTrend ?? []).some((m) => m.revenue > 0) ? (
            <BarChart
              items={(analytics?.monthlyTrend ?? []).map((m) => ({
                label: m.label?.split(' ')[0]?.slice(0, 3) ?? m.key,
                value: m.revenue,
              }))}
              valueKey="value"
              labelKey="label"
              formatValue={formatMxn}
            />
          ) : (
            <p className="adm-panel-card__empty">Sin pagos registrados aún.</p>
          )}
        </section>
      </div>

      {status?.bookings?.length > 0 ? (
        <section className="adm-panel-card adm-panel-card--wide adm-recent">
          <div className="adm-recent__head">
            <div>
              <h3 className="adm-panel-card__title">Últimas reservas</h3>
              <p className="adm-panel-card__desc">Reenvía al doctor los correos de citas ya pagadas.</p>
            </div>
            {paidBookings.length > 0 ? (
              <button
                type="button"
                className="adm-recent__bulk-btn"
                disabled={resendingAll || refreshing}
                onClick={onResendAllPaid}
              >
                {resendingAll ? 'Enviando…' : 'Reenviar todos al doctor'}
              </button>
            ) : null}
          </div>
          <div className="adm-recent__table-wrap">
            <table className="adm-recent__table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Pago</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {status.bookings.slice(0, 8).map((b) => {
                  const isPaid = b.depositPaid || b.paymentStatus === 'paid';
                  return (
                    <tr key={b.id}>
                      <td>{b.patient?.name ?? '—'}</td>
                      <td>{b.service}</td>
                      <td>
                        {new Date(b.start).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'America/Mexico_City',
                        })}
                      </td>
                      <td>
                        <span
                          className={`adm-recent__badge ${
                            isPaid ? 'adm-recent__badge--ok' : 'adm-recent__badge--pending'
                          }`}
                        >
                          {isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="adm-recent__actions">
                        {isPaid ? (
                          <button
                            type="button"
                            className="adm-recent__action"
                            disabled={resendingId === b.id || resendingAll}
                            onClick={() => onResendBooking?.({
                              id: b.id,
                              source: 'site',
                              depositPaid: b.depositPaid,
                              paymentStatus: b.paymentStatus,
                            })}
                          >
                            {resendingId === b.id ? '…' : 'Reenviar'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default AdminAnalyticsTab;
