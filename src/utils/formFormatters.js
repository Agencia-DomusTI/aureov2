/** Teléfono México: 10 dígitos → (442) 123-4567 */
export function formatMxPhoneInput(value) {
  const digits = value.replace(/\D/g, '').replace(/^52/, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function getMxPhoneDigits(value) {
  return value.replace(/\D/g, '').replace(/^52/, '').slice(0, 10);
}

export function isValidMxPhone(value) {
  return getMxPhoneDigits(value).length === 10;
}

export function phoneForApi(value) {
  const digits = getMxPhoneDigits(value);
  return digits.length === 10 ? `+52${digits}` : digits;
}

/** Email: minúsculas, sin espacios */
export function formatEmailInput(value) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = formatEmailInput(value);
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

/**
 * Lee parámetros tanto del query string real (?pago=ok&codigo=…#contacto)
 * como del hash (#contacto?pago=ok&codigo=…). El query real es más fiable
 * porque sobrevive a redirecciones y al scroll por ancla.
 */
export function parseHashParams() {
  const out = {};

  const search = new URLSearchParams(window.location.search);
  search.forEach((v, k) => { out[k] = v; });

  const raw = window.location.hash.replace(/^#/, '');
  const q = raw.indexOf('?');
  if (q !== -1) {
    new URLSearchParams(raw.slice(q + 1)).forEach((v, k) => { out[k] = v; });
  }

  return out;
}

export function clearHashQuery() {
  const raw = window.location.hash.replace(/^#/, '');
  const anchor = raw.split('?')[0] || 'contacto';
  window.history.replaceState(null, '', `${window.location.pathname}#${anchor}`);
}
