
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists liquidaciones_created_by_idx
  on public.liquidaciones(created_by);

drop policy if exists perfiles_admin_all on public.perfiles;
drop policy if exists perfiles_vendedor_select on public.perfiles;
drop policy if exists perfiles_mecanico_select_self on public.perfiles;

create policy perfiles_select
on public.perfiles for select
to authenticated
using (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and (
      id = (select auth.uid())
      or (rol = 'MECANICO' and activo = true)
    )
  )
  or (
    private.current_user_role() = 'MECANICO'
    and id = (select auth.uid())
  )
);

create policy perfiles_admin_insert
on public.perfiles for insert
to authenticated
with check (private.current_user_role() = 'ADMIN');

create policy perfiles_admin_update
on public.perfiles for update
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy perfiles_admin_delete
on public.perfiles for delete
to authenticated
using (private.current_user_role() = 'ADMIN');

drop policy if exists tipos_trabajo_admin_select on public.tipos_trabajo;
drop policy if exists tipos_trabajo_vendedor_select on public.tipos_trabajo;

create policy tipos_trabajo_select
on public.tipos_trabajo for select
to authenticated
using (
  private.current_user_role() = 'ADMIN'
  or (private.current_user_role() = 'VENDEDOR' and activo = true)
);

drop policy if exists ordenes_admin_all on public.ordenes;
drop policy if exists ordenes_vendedor_select on public.ordenes;
drop policy if exists ordenes_vendedor_insert on public.ordenes;
drop policy if exists ordenes_vendedor_update on public.ordenes;
drop policy if exists ordenes_mecanico_select on public.ordenes;

create policy ordenes_select
on public.ordenes for select
to authenticated
using (
  private.current_user_role() in ('ADMIN','VENDEDOR')
  or (
    private.current_user_role() = 'MECANICO'
    and mecanico_id = (select auth.uid())
  )
);

create policy ordenes_insert
on public.ordenes for insert
to authenticated
with check (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and vendedor_id = (select auth.uid())
  )
);

create policy ordenes_update
on public.ordenes for update
to authenticated
using (private.current_user_role() in ('ADMIN','VENDEDOR'))
with check (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy ordenes_delete
on public.ordenes for delete
to authenticated
using (private.current_user_role() = 'ADMIN');

drop policy if exists trabajos_admin_all on public.trabajos_orden;
drop policy if exists trabajos_vendedor_select on public.trabajos_orden;
drop policy if exists trabajos_vendedor_insert on public.trabajos_orden;
drop policy if exists trabajos_vendedor_update on public.trabajos_orden;
drop policy if exists trabajos_vendedor_delete on public.trabajos_orden;
drop policy if exists trabajos_mecanico_select on public.trabajos_orden;

create policy trabajos_select
on public.trabajos_orden for select
to authenticated
using (
  private.current_user_role() in ('ADMIN','VENDEDOR')
  or (
    private.current_user_role() = 'MECANICO'
    and exists (
      select 1
      from public.ordenes o
      where o.id = orden_id
        and o.mecanico_id = (select auth.uid())
    )
  )
);

create policy trabajos_insert
on public.trabajos_orden for insert
to authenticated
with check (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and exists (
      select 1
      from public.ordenes o
      where o.id = orden_id
        and o.estado <> 'TERMINADA'
    )
  )
);

create policy trabajos_update
on public.trabajos_orden for update
to authenticated
using (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and exists (
      select 1
      from public.ordenes o
      where o.id = orden_id
        and o.estado <> 'TERMINADA'
    )
  )
)
with check (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and exists (
      select 1
      from public.ordenes o
      where o.id = orden_id
        and o.estado <> 'TERMINADA'
    )
  )
);

create policy trabajos_delete
on public.trabajos_orden for delete
to authenticated
using (
  private.current_user_role() = 'ADMIN'
  or (
    private.current_user_role() = 'VENDEDOR'
    and exists (
      select 1
      from public.ordenes o
      where o.id = orden_id
        and o.estado <> 'TERMINADA'
    )
  )
);

create or replace function private.recalculate_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id bigint;
begin
  if tg_op = 'DELETE' then
    v_order_id := old.orden_id;
  else
    v_order_id := new.orden_id;
  end if;

  update public.ordenes
  set updated_at = now()
  where id = v_order_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

revoke all on function private.recalculate_order() from public;

create or replace function private.recalculate_liquidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_liq_id bigint;
begin
  if tg_op = 'DELETE' then
    v_liq_id := old.liquidacion_id;
  else
    v_liq_id := new.liquidacion_id;
  end if;

  update public.liquidaciones l
  set total_pagado = (
        select coalesce(sum(lo.monto_pagado), 0)
        from public.liquidacion_ordenes lo
        where lo.liquidacion_id = v_liq_id
      ),
      updated_at = now()
  where l.id = v_liq_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

revoke all on function private.recalculate_liquidation() from public;
;
