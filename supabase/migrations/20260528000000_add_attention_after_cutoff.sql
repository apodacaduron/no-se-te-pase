alter table public.payments
add column if not exists attention_after_cutoff boolean not null default false;
