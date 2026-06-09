-- Aureo Clinique — backend Supabase

create table if not exists public.clinic_settings (
  id int primary key default 1 check (id = 1),
  schedule jsonb not null default '{"weekday":[[10,14],[16,19]],"saturday":[[10,14]],"sunday":"by_request"}'::jsonb,
  schedule_summary text not null default 'Lun–Vie 10:00–14:00 y 16:00–19:00 · Sáb 10:00–14:00 · Dom con cita previa',
  slot_interval_minutes int not null default 15,
  buffer_minutes int not null default 10,
  min_advance_hours int not null default 4,
  max_advance_days int not null default 90,
  payment_url text,
  timezone text not null default 'America/Mexico_City',
  updated_at timestamptz not null default now()
);

insert into public.clinic_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.google_calendar_connection (
  id int primary key default 1 check (id = 1),
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  email text,
  calendar_id text not null default 'primary',
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.google_calendar_connection (id) values (1) on conflict (id) do nothing;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  service text not null,
  duration_minutes int not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  patient_notes text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_start_at_idx on public.bookings (start_at desc);

create table if not exists public.oauth_states (
  state text primary key,
  created_at timestamptz not null default now()
);

-- Solo admins autenticados (tabla opcional para whitelist)
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.clinic_settings enable row level security;
alter table public.google_calendar_connection enable row level security;
alter table public.bookings enable row level security;
alter table public.oauth_states enable row level security;
alter table public.admin_profiles enable row level security;

-- Sin acceso directo desde el cliente; todo vía Edge Functions con service role
create policy "deny_all_clinic_settings" on public.clinic_settings for all using (false);
create policy "deny_all_google" on public.google_calendar_connection for all using (false);
create policy "deny_all_bookings" on public.bookings for all using (false);
create policy "deny_all_oauth_states" on public.oauth_states for all using (false);
create policy "deny_all_admin_profiles" on public.admin_profiles for all using (false);
