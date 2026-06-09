-- Pagos Stripe y código de confirmación por reserva

alter table public.bookings
  add column if not exists confirmation_code text unique,
  add column if not exists deposit_amount_mxn int,
  add column if not exists stripe_session_id text,
  add column if not exists deposit_paid boolean not null default false,
  add column if not exists payment_status text not null default 'pending';

create index if not exists bookings_confirmation_code_idx on public.bookings (confirmation_code);
