-- Cashly · 0006 · Movimientos programados y metas de ahorro
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0005).

-- ============================================================
-- Movimientos programados (reglas que generan movimientos)
-- ============================================================
create table public.recurring_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  category_id    uuid,
  type           public.transaction_type not null,
  amount         numeric(14,2) not null check (amount > 0),
  description    text check (char_length(description) <= 200),
  frequency      text not null default 'monthly'
                 check (frequency in ('monthly', 'weekly', 'yearly')),
  -- Solo para frecuencia mensual: día del mes (si el mes es más corto, se usa su último día).
  day_of_month   smallint check (day_of_month between 1 and 31),
  start_date     date not null default current_date,
  end_date       date,
  last_generated date,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (frequency <> 'monthly' or day_of_month is not null),
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type)
    on delete set null (category_id)
);

create index recurring_user_idx on public.recurring_transactions (user_id, active);

alter table public.recurring_transactions enable row level security;
revoke all on public.recurring_transactions from anon;
grant select, insert, update, delete on public.recurring_transactions to authenticated;

create policy "recurring_own" on public.recurring_transactions
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Cada movimiento generado recuerda su regla; no puede duplicarse la misma fecha.
alter table public.transactions
  add column recurring_id uuid references public.recurring_transactions(id) on delete set null;

create unique index transactions_recurring_uidx
  on public.transactions (recurring_id, occurred_on)
  where recurring_id is not null;

-- Genera los movimientos pendientes de un usuario hasta hoy (hora de Chile).
-- Es idempotente: se puede llamar cuantas veces se quiera.
create function public.generate_recurring_for(p_user uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_today    date := (now() at time zone 'America/Santiago')::date;
  v_total    integer := 0;
  v_inserted integer;
  r          record;
begin
  for r in
    select * from public.recurring_transactions
     where user_id = p_user and active
  loop
    insert into public.transactions
      (user_id, category_id, type, amount, occurred_on, description, recurring_id)
    select r.user_id, r.category_id, r.type, r.amount, days.d, r.description, r.id
      from (
        select gs::date as d
          from generate_series(
                 greatest(r.start_date, v_today - 730)::timestamp,
                 least(v_today, coalesce(r.end_date, v_today))::timestamp,
                 interval '1 day') gs
      ) days
     where (r.last_generated is null or days.d > r.last_generated)
       and (
            (r.frequency = 'weekly'
               and extract(isodow from days.d) = extract(isodow from r.start_date))
         or (r.frequency = 'monthly'
               and extract(day from days.d) = least(
                     r.day_of_month,
                     extract(day from (date_trunc('month', days.d::timestamp)
                                       + interval '1 month' - interval '1 day'))))
         or (r.frequency = 'yearly'
               and extract(month from days.d) = extract(month from r.start_date)
               and extract(day from days.d) = least(
                     extract(day from r.start_date),
                     extract(day from (date_trunc('month', days.d::timestamp)
                                       + interval '1 month' - interval '1 day'))))
       )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;
    v_total := v_total + v_inserted;

    update public.recurring_transactions
       set last_generated = v_today
     where id = r.id;
  end loop;

  return v_total;
end $$;

-- Para la app: solo genera los del usuario autenticado.
create function public.generate_my_recurring() returns integer
language sql security definer set search_path = '' as $$
  select public.generate_recurring_for((select auth.uid()));
$$;

-- Para el cron: recorre todos los usuarios con reglas activas.
create function public.generate_recurring_all() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  u uuid;
  t integer := 0;
begin
  for u in select distinct user_id from public.recurring_transactions where active loop
    t := t + public.generate_recurring_for(u);
  end loop;
  return t;
end $$;

revoke execute on function public.generate_recurring_for(uuid) from public, anon, authenticated;
revoke execute on function public.generate_recurring_all()     from public, anon, authenticated;
revoke execute on function public.generate_my_recurring()      from public, anon;
grant  execute on function public.generate_my_recurring()      to authenticated;

-- Ejecución diaria automática (00:05 hora de Chile aprox.). Si pg_cron no está disponible,
-- los movimientos igualmente se generan al abrir la app.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('cashly-recurring', '5 3 * * *', 'select public.generate_recurring_all()');
exception when others then
  raise notice 'pg_cron no disponible: los programados se generarán al abrir la app.';
end $$;

-- ============================================================
-- Metas de ahorro
-- ============================================================
create table public.savings_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 60),
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date   date,
  color         text not null default '#10b981' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon          text not null default 'target' check (icon ~ '^[a-z]{2,20}$'),
  created_at    timestamptz not null default now(),
  unique (id, user_id)
);

create table public.goal_contributions (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid not null,
  user_id        uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  -- Positivo = aporte; negativo = retiro.
  amount         numeric(14,2) not null check (amount <> 0),
  note           text check (char_length(note) <= 100),
  contributed_on date not null default current_date,
  created_at     timestamptz not null default now(),
  foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id)
    on delete cascade
);

create index goal_contributions_goal_idx on public.goal_contributions (goal_id, contributed_on desc);

alter table public.savings_goals      enable row level security;
alter table public.goal_contributions enable row level security;

revoke all on public.savings_goals, public.goal_contributions from anon;
grant select, insert, update, delete on public.savings_goals      to authenticated;
grant select, insert, delete          on public.goal_contributions to authenticated;

create policy "savings_goals_own" on public.savings_goals
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "goal_contributions_own" on public.goal_contributions
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
