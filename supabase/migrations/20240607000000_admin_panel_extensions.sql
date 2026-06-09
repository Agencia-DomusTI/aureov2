-- Panel admin: anticipo Stripe, catálogo de servicios editable

alter table public.clinic_settings
  add column if not exists deposit_amount_mxn int not null default 250,
  add column if not exists services_config jsonb not null default '{}'::jsonb;
