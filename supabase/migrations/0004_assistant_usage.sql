-- Cashly · 0004 · Registro de uso del asistente (límite por usuario)
-- Ejecutar una sola vez en Supabase → SQL Editor.

create table public.assistant_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index assistant_usage_user_time_idx
  on public.assistant_usage (user_id, created_at desc);

alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from anon;
grant select, insert on public.assistant_usage to authenticated;

create policy "assistant_usage_select_own" on public.assistant_usage
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "assistant_usage_insert_own" on public.assistant_usage
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
