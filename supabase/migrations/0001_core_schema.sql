-- Cashly · 0001 · Esquema base: categorías y movimientos
-- Ejecutar una sola vez en Supabase → SQL Editor.

-- ============ Tipos ============
create type public.transaction_type as enum ('income', 'expense');

-- ============ Categorías ============
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
             references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  type       public.transaction_type not null,
  color      text not null default '#10b981' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (user_id, type, name),
  unique (id, user_id, type)            -- permite la FK compuesta de transactions
);

-- ============ Movimientos ============
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  category_id uuid,
  type        public.transaction_type not null,
  amount      numeric(14,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  description text check (char_length(description) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- La categoría debe ser del mismo usuario y del mismo tipo.
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type)
    on delete set null (category_id)
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_user_cat_idx  on public.transactions (user_id, category_id);

-- updated_at automático
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

revoke all on public.categories, public.transactions from anon;
grant select, insert, update, delete
  on public.categories, public.transactions to authenticated;

create policy "categories_own" on public.categories
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions_own" on public.transactions
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============ Categorías por defecto ============
create function public.seed_default_categories(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.categories (user_id, name, type, color) values
    (p_user, 'Alimentación',    'expense', '#f59e0b'),
    (p_user, 'Transporte',      'expense', '#3b82f6'),
    (p_user, 'Vivienda',        'expense', '#8b5cf6'),
    (p_user, 'Servicios',       'expense', '#06b6d4'),
    (p_user, 'Salud',           'expense', '#ef4444'),
    (p_user, 'Educación',       'expense', '#6366f1'),
    (p_user, 'Entretenimiento', 'expense', '#ec4899'),
    (p_user, 'Compras',         'expense', '#f97316'),
    (p_user, 'Otros gastos',    'expense', '#64748b'),
    (p_user, 'Sueldo',          'income',  '#10b981'),
    (p_user, 'Freelance',       'income',  '#14b8a6'),
    (p_user, 'Inversiones',     'income',  '#84cc16'),
    (p_user, 'Otros ingresos',  'income',  '#22c55e')
  on conflict do nothing;
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end $$;

-- Las funciones internas no deben ser invocables desde la API pública.
revoke execute on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Usuarios que ya existen reciben sus categorías ahora.
select public.seed_default_categories(id) from auth.users;
