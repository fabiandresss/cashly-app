-- Cashly · 0010 · Endurecimiento de seguridad
-- Ejecutar una sola vez en Supabase → SQL Editor (después de 0009).
--
-- Hallazgo del Security Advisor: `generate_my_recurring()` era SECURITY DEFINER y ejecutable
-- por usuarios con sesión. Se reemplaza por funciones SECURITY INVOKER: corren con los permisos
-- (y la RLS) de quien las llama, así que ya no hay escalada de privilegios posible.

-- Genera los movimientos programados pendientes de un usuario, hasta hoy (hora de Chile).
-- INVOKER: con RLS, un usuario solo puede ver y modificar sus propias reglas, de modo que
-- llamarla con el id de otra persona no hace nada. El cron la ejecuta como propietario.
create or replace function public.generate_recurring_for(p_user uuid) returns integer
language plpgsql security invoker set search_path = '' as $$
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

-- Para la app: solo actúa sobre el usuario autenticado.
create or replace function public.generate_my_recurring() returns integer
language sql security invoker set search_path = '' as $$
  select public.generate_recurring_for((select auth.uid()));
$$;

-- Para el cron: recorre todos los usuarios con reglas activas (solo lo ejecuta el propietario).
create or replace function public.generate_recurring_all() returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  u uuid;
  t integer := 0;
begin
  for u in select distinct user_id from public.recurring_transactions where active loop
    t := t + public.generate_recurring_for(u);
  end loop;
  return t;
end $$;

revoke execute on function public.generate_recurring_for(uuid) from public, anon;
revoke execute on function public.generate_my_recurring()      from public, anon;
revoke execute on function public.generate_recurring_all()     from public, anon, authenticated;
grant  execute on function public.generate_recurring_for(uuid) to authenticated;
grant  execute on function public.generate_my_recurring()      to authenticated;
