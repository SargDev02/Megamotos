
create or replace function public.liquidar_ordenes_mecanico(
  p_mecanico_id uuid,
  p_orden_ids bigint[]
)
returns table (
  liquidacion_id bigint,
  total_pagado numeric,
  cantidad_ordenes integer,
  fecha_pago date
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_liquidacion_id bigint;
  v_orden_ids bigint[];
  v_cantidad_solicitada integer;
  v_cantidad_distinta integer;
  v_cantidad_valida integer;
  v_cantidad_insertada integer;
  v_total numeric(14, 0);
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if private.current_user_role() is distinct from 'ADMIN' then
    raise exception 'Solo ADMIN puede registrar pagos';
  end if;

  if not exists (
    select 1
    from public.perfiles as p
    where p.id = p_mecanico_id
      and p.rol = 'MECANICO'
  ) then
    raise exception 'El mecanico indicado no existe';
  end if;

  if coalesce(cardinality(p_orden_ids), 0) = 0 then
    raise exception 'Selecciona al menos una orden para liquidar';
  end if;

  if exists (
    select 1
    from unnest(p_orden_ids) as seleccion(orden_id)
    where seleccion.orden_id is null
  ) then
    raise exception 'La seleccion contiene ordenes invalidas';
  end if;

  select
    array_agg(distinct seleccion.orden_id order by seleccion.orden_id),
    count(*)::integer,
    count(distinct seleccion.orden_id)::integer
  into
    v_orden_ids,
    v_cantidad_solicitada,
    v_cantidad_distinta
  from unnest(p_orden_ids) as seleccion(orden_id);

  if v_cantidad_solicitada <> v_cantidad_distinta then
    raise exception 'La seleccion contiene ordenes duplicadas';
  end if;

  perform o.id
  from public.ordenes as o
  where o.id = any(v_orden_ids)
  order by o.id
  for update;

  select count(*)::integer
    into v_cantidad_valida
  from public.ordenes as o
  where o.id = any(v_orden_ids)
    and o.mecanico_id = p_mecanico_id
    and o.estado = 'TERMINADA'
    and not exists (
      select 1
      from public.liquidacion_ordenes as lo
      where lo.orden_id = o.id
    );

  if v_cantidad_valida <> v_cantidad_solicitada then
    raise exception
      'Una o mas ordenes no existen, no pertenecen al mecanico, no estan terminadas o ya fueron liquidadas';
  end if;

  insert into public.liquidaciones (
    mecanico_id,
    fecha_pago,
    total_pagado,
    created_by
  )
  values (
    p_mecanico_id,
    current_date,
    0,
    auth.uid()
  )
  returning id into v_liquidacion_id;

  insert into public.liquidacion_ordenes (
    liquidacion_id,
    orden_id,
    monto_pagado
  )
  select
    v_liquidacion_id,
    o.id,
    o.pago_mecanico
  from public.ordenes as o
  where o.id = any(v_orden_ids)
  order by o.id;

  get diagnostics v_cantidad_insertada = row_count;

  if v_cantidad_insertada <> v_cantidad_solicitada then
    raise exception 'No fue posible registrar todas las ordenes seleccionadas';
  end if;

  select coalesce(sum(lo.monto_pagado), 0)
    into v_total
  from public.liquidacion_ordenes as lo
  where lo.liquidacion_id = v_liquidacion_id;

  update public.liquidaciones as l
  set
    total_pagado = v_total,
    updated_at = now()
  where l.id = v_liquidacion_id;

  return query
  select
    l.id,
    l.total_pagado,
    v_cantidad_insertada,
    l.fecha_pago
  from public.liquidaciones as l
  where l.id = v_liquidacion_id;
exception
  when unique_violation then
    raise exception 'Una o mas ordenes ya fueron liquidadas';
end;
$function$;

revoke execute on function public.liquidar_ordenes_mecanico(uuid, bigint[])
from public;

revoke execute on function public.liquidar_ordenes_mecanico(uuid, bigint[])
from anon;

grant execute on function public.liquidar_ordenes_mecanico(uuid, bigint[])
to authenticated;
;
