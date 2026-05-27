alter table public.payments add column if not exists is_approximate boolean not null default false;
