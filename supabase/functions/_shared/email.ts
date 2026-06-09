const TZ = 'America/Mexico_City';

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    });
  } catch {
    return iso;
  }
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: TZ,
    });
  } catch {
    return iso;
  }
}

export interface BookingEmailData {
  service: string;
  startAt: string;
  endAt: string;
  patientName: string;
  patientEmail?: string | null;
  confirmationCode: string;
  depositAmountMxn?: number | null;
  paid?: boolean;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'Aureo Clinique <citas@aureoclinique.com>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado: se omite el envío de correo.');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error enviando correo:', (err as Error).message);
    return false;
  }
}

function buildConfirmationHtml(data: BookingEmailData) {
  const dateLabel = fmtDate(data.startAt);
  const timeLabel = `${fmtTime(data.startAt)} – ${fmtTime(data.endAt)}`;
  const depositRow =
    data.depositAmountMxn && data.depositAmountMxn > 0
      ? `<tr><td style="padding:6px 0;color:#6b7280;">Anticipo${data.paid ? ' (pagado)' : ''}</td><td style="padding:6px 0;color:#0e2138;font-weight:600;text-align:right;">$${data.depositAmountMxn} MXN</td></tr>`
      : '';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0e2138;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,33,56,0.08);">
        <tr><td style="background:#0e2138;padding:28px 32px;text-align:center;">
          <div style="color:#c9a86a;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Aureo Clinique</div>
          <div style="color:#ffffff;font-size:22px;font-weight:600;margin-top:8px;">¡Tu cita está confirmada!</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
            Hola <strong>${data.patientName}</strong>, recibimos tu ${data.paid ? 'pago de anticipo' : 'reserva'} correctamente.
            Estos son los detalles de tu cita:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:20px;">
            <tr><td style="padding:6px 0;color:#6b7280;">Tratamiento</td><td style="padding:6px 0;color:#0e2138;font-weight:600;text-align:right;">${data.service}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="padding:6px 0;color:#0e2138;font-weight:600;text-align:right;text-transform:capitalize;">${dateLabel}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Horario</td><td style="padding:6px 0;color:#0e2138;font-weight:600;text-align:right;">${timeLabel}</td></tr>
            ${depositRow}
            <tr><td style="padding:6px 0;color:#6b7280;">Código</td><td style="padding:6px 0;color:#c9a86a;font-weight:700;text-align:right;">${data.confirmationCode}</td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#374151;">
            Te esperamos. Si necesitas reagendar o tienes alguna duda, responde a este correo o escríbenos por WhatsApp.
          </p>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
            Aureo Clinique · Medicina Estética y Regenerativa · Querétaro y Zapopan
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!data.patientEmail) {
    console.warn('Reserva sin email de paciente: no se envía confirmación.');
    return false;
  }
  return sendEmail({
    to: data.patientEmail,
    subject: `Cita confirmada · ${data.service} (${data.confirmationCode})`,
    html: buildConfirmationHtml(data),
  });
}
