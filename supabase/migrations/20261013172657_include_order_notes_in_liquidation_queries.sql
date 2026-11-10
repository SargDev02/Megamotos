drop function public.listar_pagos_pendientes();

create function public.listar_pagos_pendientes()
returns table (
  orden_id bigint,
  mecanico_id uuid,
  mecanico_nombre text,
  moto_placa text,
  moto_marca text,
  moto_modelo text,
  total_cobrado numeric,
  pago_mecanico numeric,
  completed_at timestamptz,
  observaciones text,
  trabajos jsonb
)
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if private.current_user_role() <> 'ADMIN' then
    raise exception 'Solo ADMIN puede consultar pagos pendientes';
  end if;

  return query
  select
    o.id as orden_id,
    o.mecanico_id,
    p.nombre as mecanico_nombre,
    m.placa as moto_placa,
    mm.nombre as moto_marca,
    m.modelo as moto_modelo,
    o.total as total_cobrado,
    o.pago_mecanico,
    o.completed_at,
    o.observaciones,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'nombre_trabajo', t.nombre_trabajo
          )
          order by t.id
        )
        from public.trabajos_orden as t
        where t.orden_id = o.id
      ),
      '[]'::jsonb
    ) as trabajos
  from public.ordenes as o
  join public.perfiles as p
    on p.id = o.mecanico_id
  join public.motos as m
    on m.id = o.moto_id
  join public.marcas_moto as mm
    on mm.id = m.marca_id
  where o.estado = 'TERMINADA'
    and not exists (
      select 1
      from public.liquidacion_ordenes as lo
      where lo.orden_id = o.id
    )
  order by p.nombre, o.completed_at, o.id;
end;
$function$;

revoke execute on function public.listar_pagos_pendientes()
  from PUBLIC, anon;
grant execute on function public.listar_pagos_pendientes()
  to authenticated, service_role;

drop function public.listar_historial_pagos();

create function public.listar_historial_pagos()
returns table (
  liquidacion_id bigint,
  fecha_pago date,
  created_at timestamptz,
  mecanico_id uuid,
  mecanico_nombre text,
  total_pagado numeric,
  descuento_prestamos numeric,
  total_entregado numeric,
  total_cobrado numeric,
  moto_placa text,
  moto_marca text,
  moto_modelo text,
  observaciones text,
  monto_pagado numeric,
  trabajos jsonb
)
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if private.current_user_role() is distinct from 'ADMIN' then
    raise exception 'Solo ADMIN puede consultar el historial de pagos';
  end if;

  return query
  select
    l.id,
    l.fecha_pago,
    l.created_at,
    l.mecanico_id,
    p.nombre,
    l.total_pagado,
    l.descuento_prestamos,
    l.total_entregado,
    o.total,
    m.placa,
    mm.nombre,
    m.modelo,
    o.observaciones,
    lo.monto_pagado,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'nombre_trabajo', t.nombre_trabajo
          )
          order by t.id
        )
        from public.trabajos_orden as t
        where t.orden_id = o.id
      ),
      '[]'::jsonb
    )
  from public.liquidaciones as l
  join public.perfiles as p
    on p.id = l.mecanico_id
  join public.liquidacion_ordenes as lo
    on lo.liquidacion_id = l.id
  join public.ordenes as o
    on o.id = lo.orden_id
  join public.motos as m
    on m.id = o.moto_id
  join public.marcas_moto as mm
    on mm.id = m.marca_id
  order by l.created_at desc, l.id desc, m.placa;
end;
$function$;

revoke execute on function public.listar_historial_pagos()
  from PUBLIC, anon;
grant execute on function public.listar_historial_pagos()
  to authenticated, service_role;;
