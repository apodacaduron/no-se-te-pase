-- ============================================
-- No se te pase — Supabase Schema
-- Corre esto en el SQL Editor de Supabase
-- ============================================

-- Payments table
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  name          text not null,
  category      text not null check (category in ('credit_card', 'insurance', 'utility', 'subscription', 'other')),
  frequency     text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom')),
  amount        numeric(12, 2),
  currency      text not null default 'MXN',

  -- Credit card fields
  cutoff_day    int check (cutoff_day between 1 and 31),
  due_day       int check (due_day between 1 and 31),

  -- Other payment fields
  next_due_date date,

  -- Status tracking
  last_paid_date date,
  notes          text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: cada usuario solo ve sus pagos
alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payments"
  on public.payments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own payments"
  on public.payments for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger payments_updated_at
  before update on public.payments
  for each row execute procedure public.handle_updated_at();
