alter table public.payments
add column if not exists is_paused boolean not null default false,
add column if not exists last_paid_amount numeric(12, 2);
