-- Cashly · Prueba de aislamiento entre usuarios (RLS)
--
-- Requisito: haber ejecutado antes la migración 0010 (generate_recurring_for pasa a SECURITY INVOKER).
-- Cómo usarla: pégala completa en Supabase → SQL Editor → Run.
-- Simula a OTRO usuario autenticado (un id inventado) y comprueba que:
--   1) no ve ninguna fila de ninguna tabla,
--   2) no puede insertar a nombre de otro usuario,
--   3) no puede modificar ni borrar datos ajenos,
--   4) no puede usar las funciones (pay_debt, etc.) sobre datos ajenos.
-- Todo ocurre dentro de una transacción que se REVIERTE al final: no deja ni modifica datos.
-- Resultado: lee los mensajes "NOTICE". Si algo falla, la ejecución se detiene con "FALLO: ...".

begin;

do $$
declare
  real_user  uuid := (select id from auth.users order by created_at limit 1);
  fake_user  uuid := '11111111-1111-1111-1111-111111111111';
  tbl        text;
  n          bigint;
  affected   bigint;
  state      text;
begin
  if real_user is null then
    raise exception 'No hay usuarios en auth.users: registra tu cuenta antes de correr esta prueba.';
  end if;

  -- Desde aquí, las consultas corren como un usuario autenticado distinto al dueño de los datos.
  perform set_config('request.jwt.claims',
                     json_build_object('sub', fake_user, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) Lectura: otro usuario no debe ver nada.
  foreach tbl in array array[
    'categories', 'transactions', 'budgets', 'user_settings', 'recurring_transactions',
    'transaction_templates', 'savings_goals', 'goal_contributions', 'debts', 'debt_payments',
    'assistant_conversations', 'assistant_messages', 'assistant_usage'
  ] loop
    execute format('select count(*) from public.%I', tbl) into n;
    if n <> 0 then
      raise exception 'FALLO: % expone % filas a otro usuario', tbl, n;
    end if;
    raise notice 'OK  lectura aislada  → %', tbl;
  end loop;

  -- 2) Escritura a nombre de otro usuario: debe ser rechazada por RLS.
  begin
    insert into public.transactions (user_id, type, amount, occurred_on)
    values (real_user, 'expense', 1, current_date);
    raise exception 'FALLO: pudo insertar un movimiento a nombre de otro usuario';
  exception when sqlstate '42501' then
    raise notice 'OK  insert a nombre ajeno bloqueado → transactions';
  end;

  begin
    insert into public.savings_goals (user_id, name, target_amount)
    values (real_user, 'x', 1);
    raise exception 'FALLO: pudo insertar una meta a nombre de otro usuario';
  exception when sqlstate '42501' then
    raise notice 'OK  insert a nombre ajeno bloqueado → savings_goals';
  end;

  -- 3) Modificar o borrar datos ajenos: no debe afectar ninguna fila.
  update public.transactions set amount = 999999999 where user_id = real_user;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FALLO: modificó % movimientos ajenos', affected; end if;
  raise notice 'OK  update ajeno sin efecto → transactions';

  delete from public.transactions where user_id = real_user;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FALLO: borró % movimientos ajenos', affected; end if;
  raise notice 'OK  delete ajeno sin efecto → transactions';

  delete from public.categories where user_id = real_user;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FALLO: borró % categorías ajenas', affected; end if;
  raise notice 'OK  delete ajeno sin efecto → categories';

  -- 4) Funciones: no deben poder operar sobre datos ajenos.
  begin
    perform public.pay_debt(
      (select id from public.debts limit 1), 1, current_date);   -- no ve ninguna deuda
    raise exception 'FALLO: pay_debt operó sobre una deuda ajena';
  exception
    when others then
      get stacked diagnostics state = returned_sqlstate;
      if sqlstate = 'P0001' and sqlerrm like 'FALLO%' then raise; end if;
      raise notice 'OK  pay_debt no puede usar deudas ajenas';
  end;

  select public.generate_recurring_for(real_user) into n;
  if n <> 0 then raise exception 'FALLO: generate_recurring_for generó % movimientos ajenos', n; end if;
  raise notice 'OK  generate_recurring_for(ajeno) no genera nada';

  reset role;
  raise notice '------------------------------------------------------------';
  raise notice 'RESULTADO: aislamiento entre usuarios verificado (sin fallos).';
end $$;

rollback;  -- no se conserva ningún cambio
