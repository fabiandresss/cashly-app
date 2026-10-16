-- Cashly · 0009 · Deudas y pagos
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0008).

create table public.debts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 100),
  total_amount numeric(14,2) not null check (total_amount > 0),
  due_date     date,
  -- Categoría de gasto que se usará al registrar los pagos.
  category_id  uuid,
  type         public.transaction_type not null default 'expense' check (type = 'expense'),
  notes        text check (char_length(notes) <= 200),
  created_at   timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type)
    on delete set null (category_id)
);

create table public.debt_payments (
  id             uuid primary key default gen_random_uuid(),
  debt_id        uuid not null,
  user_id        uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  amount         numeric(14,2) not null check (amount > 0),
  paid_on        date not null default current_date,
  -- Movimiento de gasto generado por este pago.
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at     timestamptz not null default now(),
  foreign key (debt_id, user_id)
    references public.debts (id, user_id)
    on delete cascade
);

create index debts_user_idx on public.debts (user_id, created_at desc);
create index debt_payments_debt_idx on public.debt_payments (debt_id, paid_on desc);

alter table public.debts         enable row level security;
alter table public.debt_payments enable row level security;

revoke all on public.debts, public.debt_payments from anon;
grant select, insert, update, delete on public.debts         to authenticated;
grant select, insert, delete          on public.debt_payments to authenticated;

create policy "debts_own" on public.debts
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "debt_payments_own" on public.debt_payments
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Registra un pago: crea el movimiento de gasto y el pago en una sola operación.
-- Corre con los permisos del usuario (RLS aplica), así que solo toca lo suyo.
create function public.pay_debt(
  p_debt_id uuid,
  p_amount  numeric,
  p_paid_on date default current_date
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_debt      public.debts%rowtype;
  v_paid      numeric;
  v_remaining numeric;
  v_tx        uuid;
begin
  select * into v_debt from public.debts where id = p_debt_id;
  if not found then
    raise exception 'debt_not_found';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select coalesce(sum(amount), 0) into v_paid
    from public.debt_payments where debt_id = p_debt_id;
  v_remaining := v_debt.total_amount - v_paid;
  if p_amount > v_remaining then
    raise exception 'exceeds_remaining';
  end if;

  insert into public.transactions (type, amount, occurred_on, category_id, name, description)
  values ('expense', p_amount, p_paid_on, v_debt.category_id,
          left('Pago: ' || v_debt.name, 100), v_debt.notes)
  returning id into v_tx;

  insert into public.debt_payments (debt_id, amount, paid_on, transaction_id)
  values (p_debt_id, p_amount, p_paid_on, v_tx);

  return v_tx;
end $$;

-- Deshace un pago: elimina el pago y el movimiento de gasto que había generado.
create function public.undo_debt_payment(p_payment_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_tx uuid;
begin
  select transaction_id into v_tx from public.debt_payments where id = p_payment_id;
  if not found then
    raise exception 'payment_not_found';
  end if;
  delete from public.debt_payments where id = p_payment_id;
  if v_tx is not null then
    delete from public.transactions where id = v_tx;
  end if;
end $$;

revoke execute on function public.pay_debt(uuid, numeric, date)  from public, anon;
revoke execute on function public.undo_debt_payment(uuid)         from public, anon;
grant  execute on function public.pay_debt(uuid, numeric, date)  to authenticated;
grant  execute on function public.undo_debt_payment(uuid)         to authenticated;
