import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAdminRequest } from './adminAuth.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export const DEFAULT_SCHEDULE = {
  timezone: 'America/Mexico_City',
  timezoneLabel: 'Hora Ciudad de México (CDMX)',
  slotIntervalMinutes: 15,
  bufferMinutes: 10,
  minAdvanceHours: 4,
  maxAdvanceDays: 90,
  schedule: {
    weekday: [[10, 14], [16, 19]],
    saturday: [[10, 14]],
    sunday: 'by_request',
  },
  scheduleSummary:
    'Lun–Vie 10:00–14:00 y 16:00–19:00 · Sáb 10:00–14:00 · Dom con cita previa',
};

export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export async function getClinicSettings(supabase: SupabaseClient) {
  const { data } = await supabase.from('clinic_settings').select('*').eq('id', 1).single();
  if (!data) return { ...DEFAULT_SCHEDULE, paymentUrl: '' };
  return {
    timezone: data.timezone ?? DEFAULT_SCHEDULE.timezone,
    timezoneLabel: DEFAULT_SCHEDULE.timezoneLabel,
    slotIntervalMinutes: data.slot_interval_minutes ?? 15,
    bufferMinutes: data.buffer_minutes ?? 10,
    minAdvanceHours: data.min_advance_hours ?? 4,
    maxAdvanceDays: data.max_advance_days ?? 90,
    schedule: data.schedule ?? DEFAULT_SCHEDULE.schedule,
    scheduleSummary: data.schedule_summary ?? DEFAULT_SCHEDULE.scheduleSummary,
    paymentUrl: data.payment_url ?? '',
  };
}

export async function verifyAdmin(req: Request) {
  const supabase = createServiceClient();
  return verifyAdminRequest(req, supabase);
}
