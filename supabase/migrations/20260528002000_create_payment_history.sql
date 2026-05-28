create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  paid_date date not null,
  amount numeric(12, 2),
  created_at timestamptz not null default now()
);

alter table public.payment_history enable row level security;

create policy "Users can view their own payment history"
  on public.payment_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payment history"
  on public.payment_history for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.payments
      where payments.id = payment_history.payment_id
        and payments.user_id = auth.uid()
    )
  );

create policy "Users can delete their own payment history"
  on public.payment_history for delete
  using (auth.uid() = user_id);
