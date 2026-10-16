-- Cashly · 0008 · Plantillas de movimientos (favoritos)
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0007).

create table public.transaction_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  category_id uuid,
  type        public.transaction_type not null,
  amount      numeric(14,2) not null check (amount > 0),
  name        text not null check (char_length(btrim(name)) between 1 and 100),
  description text check (char_length(description) <= 200),
  created_at  timestamptz not null default now(),
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type)
    on delete set null (category_id)
);

create index transaction_templates_user_idx on public.transaction_templates (user_id, created_at desc);

alter table public.transaction_templates enable row level security;
revoke all on public.transaction_templates from anon;
grant select, insert, update, delete on public.transaction_templates to authenticated;

create policy "transaction_templates_own" on public.transaction_templates
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
