-- Cashly · 0002 · Íconos de categorías
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0001).

alter table public.categories
  add column icon text not null default 'tag'
  check (icon ~ '^[a-z]{2,20}$');

-- Íconos para las categorías por defecto ya existentes.
update public.categories set icon = case name
  when 'Alimentación'    then 'food'
  when 'Transporte'      then 'car'
  when 'Vivienda'        then 'home'
  when 'Servicios'       then 'bolt'
  when 'Salud'           then 'heart'
  when 'Educación'       then 'book'
  when 'Entretenimiento' then 'film'
  when 'Compras'         then 'bag'
  when 'Otros gastos'    then 'dots'
  when 'Sueldo'          then 'wallet'
  when 'Freelance'       then 'laptop'
  when 'Inversiones'     then 'trending'
  when 'Otros ingresos'  then 'gift'
  else icon
end
where name in (
  'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Educación',
  'Entretenimiento', 'Compras', 'Otros gastos', 'Sueldo', 'Freelance',
  'Inversiones', 'Otros ingresos'
);

-- Las categorías por defecto de usuarios nuevos también incluyen ícono.
create or replace function public.seed_default_categories(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.categories (user_id, name, type, color, icon) values
    (p_user, 'Alimentación',    'expense', '#f59e0b', 'food'),
    (p_user, 'Transporte',      'expense', '#3b82f6', 'car'),
    (p_user, 'Vivienda',        'expense', '#8b5cf6', 'home'),
    (p_user, 'Servicios',       'expense', '#06b6d4', 'bolt'),
    (p_user, 'Salud',           'expense', '#ef4444', 'heart'),
    (p_user, 'Educación',       'expense', '#6366f1', 'book'),
    (p_user, 'Entretenimiento', 'expense', '#ec4899', 'film'),
    (p_user, 'Compras',         'expense', '#f97316', 'bag'),
    (p_user, 'Otros gastos',    'expense', '#64748b', 'dots'),
    (p_user, 'Sueldo',          'income',  '#10b981', 'wallet'),
    (p_user, 'Freelance',       'income',  '#14b8a6', 'laptop'),
    (p_user, 'Inversiones',     'income',  '#84cc16', 'trending'),
    (p_user, 'Otros ingresos',  'income',  '#22c55e', 'gift')
  on conflict do nothing;
$$;
