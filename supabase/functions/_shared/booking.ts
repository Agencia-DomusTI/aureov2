import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const DEFAULT_DEPOSIT_MXN = 250;

type ServiceConfig = { depositMxn?: number | string | null; priceLabel?: string; active?: boolean };

/** Por defecto activo; solo oculta si `active === false` en admin */
export function isServiceActive(
  serviceId: string,
  servicesConfig?: Record<string, ServiceConfig>,
): boolean {
  return servicesConfig?.[serviceId]?.active !== false;
}

function parseDepositValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return null;
  return Math.max(0, n);
}

export function getBaseDeposit(settings: { depositAmountMxn?: number | null }) {
  const parsed = parseDepositValue(settings.depositAmountMxn);
  return parsed ?? DEFAULT_DEPOSIT_MXN;
}

export function getServiceDeposit(
  settings: {
    depositAmountMxn?: number | null;
    servicesConfig?: Record<string, ServiceConfig>;
  },
  serviceName: string,
): number {
  const override = parseDepositValue(settings.servicesConfig?.[serviceName]?.depositMxn);
  if (override !== null) return override;
  return getBaseDeposit(settings);
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateConfirmationCode(): string {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `AUREO-${suffix}`;
}

export async function createUniqueConfirmationCode(supabase: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateConfirmationCode();
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('confirmation_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  return `AUREO-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export function buildDepositsMap(
  servicesConfig: Record<string, ServiceConfig> | undefined,
  baseDeposit: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!servicesConfig) return map;
  for (const [id, cfg] of Object.entries(servicesConfig)) {
    if (cfg.depositMxn !== undefined && cfg.depositMxn !== null) {
      map[id] = Math.max(0, Math.round(cfg.depositMxn));
    }
  }
  return map;
}
