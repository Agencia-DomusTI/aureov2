export const DEFAULT_DEPOSIT_MXN = 250;

function parseDepositValue(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return null;
  return Math.max(0, n);
}

export function getBaseDeposit(config) {
  const parsed = parseDepositValue(config?.depositAmountMxn);
  return parsed ?? DEFAULT_DEPOSIT_MXN;
}

export function getDepositForService(serviceId, config) {
  if (!serviceId || !config) return getBaseDeposit(config);
  const override = parseDepositValue(config.servicesConfig?.[serviceId]?.depositMxn);
  if (override !== null) return override;
  return getBaseDeposit(config);
}

export function formatDepositLabel(amountMxn) {
  if (!amountMxn || amountMxn <= 0) return 'Sin anticipo';
  return `Anticipo $${amountMxn} MXN`;
}
