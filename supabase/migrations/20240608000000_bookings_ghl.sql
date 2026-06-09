-- Referencias a GoHighLevel para remarketing / WhatsApp

alter table public.bookings
  add column if not exists ghl_contact_id text,
  add column if not exists ghl_appointment_id text;
