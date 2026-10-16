-- Cashly · 0003 · Presupuestos y ajustes por usuario
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0001 y 0002).

-- ============ Presupuestos ============
-- category_id NULL = presupuesto total del mes.
create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  category_id uuid,
  type        public.transaction_type not null default 'expense' check (type = 'expense'),
  month       date not null check (extract(day from month) = 1),
  amount      numeric(14,2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- La categoría debe ser del mismo usuario y de tipo gasto.
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type)
    on delete cascade
);

-- Un presupuesto por categoría y mes, y un único presupuesto total por mes.
create unique index budgets_category_month_uidx
  on public.budgets (user_id, category_id, month) where category_id is not null;
create unique index budgets_total_month_uidx
  on public.budgets (user_id, month) where category_id is null;
create index budgets_user_month_idx on public.budgets (user_id, month);

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;
revoke all on public.budgets from anon;
grant select, insert, update, delete on public.budgets to authenticated;

create policy "budgets_own" on public.budgets
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============ Ajustes por usuario ============
create table public.user_settings (
  user_id                uuid primary key default auth.uid()
                         references auth.users(id) on delete cascade,
  budget_alert_threshold smallint not null default 80
                         check (budget_alert_threshold between 50 and 100),
  updated_at             timestamptz not null default now()
);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;
revoke all on public.user_settings from anon;
grant select, insert, update on public.user_settings to authenticated;

create policy "user_settings_own" on public.user_settings
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
