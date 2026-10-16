-- Cashly · 0007 · Nombre y descripción en movimientos
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0006).
--
-- Hasta ahora `description` hacía de título. Desde ahora:
--   name        → título corto del movimiento (ej: "Supermercado Jumbo")
--   description → notas o detalle adicional
-- Los valores existentes pasan a `name`, que es como se usaban.

alter table public.transactions
  add column name text check (char_length(name) <= 100);
alter table public.recurring_transactions
  add column name text check (char_length(name) <= 100);

-- Lo que antes era "descripción" (título) pasa a ser el nombre.
-- Si era más largo que 100 caracteres, se conserva completo como descripción.
update public.transactions
   set name = left(btrim(description), 100),
       description = case when char_length(description) > 100 then description else null end
 where description is not null and btrim(description) <> '';

update public.recurring_transactions
   set name = left(btrim(description), 100),
       description = case when char_length(description) > 100 then description else null end
 where description is not null and btrim(description) <> '';

-- La generación automática de programados ahora copia también el nombre.
create or replace function public.generate_recurring_for(p_user uuid) returns integer
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
      (user_id, category_id, type, amount, occurred_on, name, description, recurring_id)
    select r.user_id, r.category_id, r.type, r.amount, days.d, r.name, r.description, r.id
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
