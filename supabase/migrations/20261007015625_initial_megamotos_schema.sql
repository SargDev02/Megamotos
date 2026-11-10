
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete restrict,
  nombre text not null check (btrim(nombre) <> ''),
  rol text not null check (rol in ('ADMIN','VENDEDOR','MECANICO')),
  porcentaje_mecanico numeric(5,2),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint perfiles_porcentaje_por_rol_chk check (
    (rol = 'MECANICO' and porcentaje_mecanico is not null and porcentaje_mecanico between 0 and 100)
    or
    (rol <> 'MECANICO' and porcentaje_mecanico is null)
  )
);

create table public.clientes (
  id bigint generated always as identity primary key,
  nombre text not null check (btrim(nombre) <> ''),
  documento text,
  telefono text not null check (btrim(telefono) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index clientes_documento_uq
  on public.clientes (lower(btrim(documento)))
  where documento is not null and btrim(documento) <> '';

create table public.motos (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  placa text not null unique check (btrim(placa) <> ''),
  marca text not null check (btrim(marca) <> ''),
  modelo text,
  cilindraje text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tipos_trabajo (
  id bigint generated always as identity primary key,
  nombre text not null check (btrim(nombre) <> ''),
  precio_base numeric(14,0) not null check (precio_base >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tipos_trabajo_nombre_uq
  on public.tipos_trabajo (lower(btrim(nombre)));

create table public.ordenes (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  moto_id bigint not null references public.motos(id) on delete restrict,
  vendedor_id uuid not null references public.perfiles(id) on delete restrict,
  mecanico_id uuid not null references public.perfiles(id) on delete restrict,
  estado text not null default 'RECIBIDA'
    check (estado in ('RECIBIDA','EN_PROCESO','TERMINADA')),
  porcentaje_mecanico numeric(5,2) not null check (porcentaje_mecanico between 0 and 100),
  total numeric(14,0) not null default 0 check (total >= 0),
  pago_mecanico numeric(14,0) not null default 0 check (pago_mecanico >= 0),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.trabajos_orden (
  id bigint generated always as identity primary key,
  orden_id bigint not null references public.ordenes(id) on delete cascade,
  tipo_trabajo_id bigint not null references public.tipos_trabajo(id) on delete restrict,
  nombre_trabajo text not null check (btrim(nombre_trabajo) <> ''),
  precio_base numeric(14,0) not null check (precio_base >= 0),
  precio_final numeric(14,0) not null check (precio_final >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.liquidaciones (
  id bigint generated always as identity primary key,
  mecanico_id uuid not null references public.perfiles(id) on delete restrict,
  fecha_pago date not null default current_date,
  total_pagado numeric(14,0) not null default 0 check (total_pagado >= 0),
  created_by uuid not null references public.perfiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.liquidacion_ordenes (
  liquidacion_id bigint not null references public.liquidaciones(id) on delete cascade,
  orden_id bigint not null references public.ordenes(id) on delete restrict,
  monto_pagado numeric(14,0) not null check (monto_pagado >= 0),
  created_at timestamptz not null default now(),
  primary key (liquidacion_id, orden_id),
  constraint liquidacion_ordenes_orden_uq unique (orden_id)
);

create index motos_cliente_idx on public.motos(cliente_id);
create index ordenes_cliente_idx on public.ordenes(cliente_id);
create index ordenes_moto_idx on public.ordenes(moto_id);
create index ordenes_vendedor_idx on public.ordenes(vendedor_id);
create index ordenes_mecanico_idx on public.ordenes(mecanico_id);
create index ordenes_estado_idx on public.ordenes(estado);
create index ordenes_created_at_idx on public.ordenes(created_at desc);
create index trabajos_orden_orden_idx on public.trabajos_orden(orden_id);
create index trabajos_orden_tipo_idx on public.trabajos_orden(tipo_trabajo_id);
create index liquidaciones_mecanico_fecha_idx on public.liquidaciones(mecanico_id, fecha_pago desc);

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid()
    and p.activo = true
  limit 1;
$$;

revoke all on function private.current_user_role() from public;
grant execute on function private.current_user_role() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger perfiles_set_updated_at
before update on public.perfiles
for each row execute function private.set_updated_at();

create trigger clientes_set_updated_at
before update on public.clientes
for each row execute function private.set_updated_at();

create trigger motos_set_updated_at
before update on public.motos
for each row execute function private.set_updated_at();

create trigger tipos_trabajo_set_updated_at
before update on public.tipos_trabajo
for each row execute function private.set_updated_at();

create trigger trabajos_orden_set_updated_at
before update on public.trabajos_orden
for each row execute function private.set_updated_at();

create trigger liquidaciones_set_updated_at
before update on public.liquidaciones
for each row execute function private.set_updated_at();

create or replace function private.normalize_moto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.placa := upper(regexp_replace(btrim(new.placa), '\s+', '', 'g'));
  new.marca := btrim(new.marca);
  if new.modelo is not null then new.modelo := btrim(new.modelo); end if;
  if new.cilindraje is not null then new.cilindraje := btrim(new.cilindraje); end if;
  if new.color is not null then new.color := btrim(new.color); end if;
  return new;
end;
$$;

revoke all on function private.normalize_moto() from public;

create trigger motos_normalize
before insert or update on public.motos
for each row execute function private.normalize_moto();

create or replace function private.prepare_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text;
  v_mec_pct numeric(5,2);
  v_cliente_moto bigint;
  v_recalc_total numeric(14,0);
begin
  v_actor := private.current_user_role();

  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      if v_actor not in ('ADMIN','VENDEDOR') then
        raise exception 'Solo ADMIN o VENDEDOR puede crear ordenes';
      end if;
      new.vendedor_id := auth.uid();
    end if;
  end if;

  if not exists (
    select 1 from public.perfiles p
    where p.id = new.vendedor_id
      and p.rol in ('ADMIN','VENDEDOR')
      and p.activo = true
  ) then
    raise exception 'El usuario receptor no es un ADMIN/VENDEDOR activo';
  end if;

  select p.porcentaje_mecanico
    into v_mec_pct
  from public.perfiles p
  where p.id = new.mecanico_id
    and p.rol = 'MECANICO'
    and p.activo = true;

  if v_mec_pct is null then
    raise exception 'El mecanico asignado no existe, no esta activo o no tiene porcentaje';
  end if;

  select m.cliente_id into v_cliente_moto
  from public.motos m
  where m.id = new.moto_id;

  if v_cliente_moto is null then
    raise exception 'La moto indicada no existe';
  end if;

  if v_cliente_moto <> new.cliente_id then
    raise exception 'La moto no pertenece al cliente indicado';
  end if;

  if tg_op = 'INSERT' then
    new.porcentaje_mecanico := v_mec_pct;
    new.total := 0;
    new.pago_mecanico := 0;
    if new.estado = 'TERMINADA' then
      new.completed_at := coalesce(new.completed_at, now());
    else
      new.completed_at := null;
    end if;
  else
    if exists (
      select 1 from public.liquidacion_ordenes lo
      where lo.orden_id = old.id
    ) then
      raise exception 'Una orden liquidada no puede modificarse';
    end if;

    if old.estado = 'TERMINADA'
       and auth.uid() is not null
       and v_actor <> 'ADMIN' then
      raise exception 'Una orden terminada solo puede ser corregida por un ADMIN';
    end if;

    if new.mecanico_id is distinct from old.mecanico_id then
      new.porcentaje_mecanico := v_mec_pct;
    else
      new.porcentaje_mecanico := old.porcentaje_mecanico;
    end if;

    if new.estado is distinct from old.estado then
      if auth.uid() is not null and v_actor = 'VENDEDOR' then
        if not (
          (old.estado = 'RECIBIDA' and new.estado = 'EN_PROCESO')
          or
          (old.estado = 'EN_PROCESO' and new.estado = 'TERMINADA')
        ) then
          raise exception 'Transicion de estado no permitida para VENDEDOR';
        end if;
      elsif auth.uid() is not null and v_actor <> 'ADMIN' then
        raise exception 'Solo ADMIN o VENDEDOR puede cambiar el estado';
      end if;

      if new.estado = 'TERMINADA' then
        new.completed_at := now();
      elsif old.estado = 'TERMINADA' then
        new.completed_at := null;
      end if;
    end if;

    select coalesce(sum(t.precio_final), 0)
      into v_recalc_total
    from public.trabajos_orden t
    where t.orden_id = old.id;

    new.total := v_recalc_total;
    new.pago_mecanico := round((new.total * new.porcentaje_mecanico) / 100.0, 0);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.prepare_order() from public;

create trigger ordenes_prepare
before insert or update on public.ordenes
for each row execute function private.prepare_order();

create or replace function private.guard_order_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.liquidacion_ordenes lo
    where lo.orden_id = old.id
  ) then
    raise exception 'Una orden liquidada no puede eliminarse';
  end if;
  return old;
end;
$$;

revoke all on function private.guard_order_delete() from public;

create trigger ordenes_guard_delete
before delete on public.ordenes
for each row execute function private.guard_order_delete();

create or replace function private.prepare_order_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado text;
  v_actor text;
  v_nombre text;
  v_precio numeric(14,0);
  v_activo boolean;
begin
  v_actor := private.current_user_role();

  select o.estado into v_estado
  from public.ordenes o
  where o.id = new.orden_id;

  if v_estado is null then
    raise exception 'La orden no existe';
  end if;

  if exists (
    select 1 from public.liquidacion_ordenes lo
    where lo.orden_id = new.orden_id
  ) then
    raise exception 'No se pueden modificar trabajos de una orden liquidada';
  end if;

  if v_estado = 'TERMINADA'
     and auth.uid() is not null
     and v_actor <> 'ADMIN' then
    raise exception 'Una orden terminada solo puede ser corregida por un ADMIN';
  end if;

  if tg_op = 'UPDATE' and new.orden_id is distinct from old.orden_id then
    raise exception 'No se puede mover un trabajo entre ordenes';
  end if;

  if tg_op = 'UPDATE' and new.tipo_trabajo_id is distinct from old.tipo_trabajo_id then
    raise exception 'Para cambiar el tipo de trabajo, elimine el registro y agreguelo nuevamente';
  end if;

  select t.nombre, t.precio_base, t.activo
    into v_nombre, v_precio, v_activo
  from public.tipos_trabajo t
  where t.id = new.tipo_trabajo_id;

  if v_nombre is null then
    raise exception 'El tipo de trabajo no existe';
  end if;

  if tg_op = 'INSERT' then
    if v_activo = false then
      raise exception 'El tipo de trabajo esta inactivo';
    end if;
    new.nombre_trabajo := v_nombre;
    new.precio_base := v_precio;
    new.precio_final := coalesce(new.precio_final, v_precio);
  else
    new.nombre_trabajo := old.nombre_trabajo;
    new.precio_base := old.precio_base;
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_order_item() from public;

create trigger trabajos_orden_prepare
before insert or update on public.trabajos_orden
for each row execute function private.prepare_order_item();

create or replace function private.guard_order_item_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado text;
  v_actor text;
begin
  v_actor := private.current_user_role();

  if exists (
    select 1 from public.liquidacion_ordenes lo
    where lo.orden_id = old.orden_id
  ) then
    raise exception 'No se pueden modificar trabajos de una orden liquidada';
  end if;

  select o.estado into v_estado
  from public.ordenes o
  where o.id = old.orden_id;

  if v_estado = 'TERMINADA'
     and auth.uid() is not null
     and v_actor <> 'ADMIN' then
    raise exception 'Una orden terminada solo puede ser corregida por un ADMIN';
  end if;

  return old;
end;
$$;

revoke all on function private.guard_order_item_delete() from public;

create trigger trabajos_orden_guard_delete
before delete on public.trabajos_orden
for each row execute function private.guard_order_item_delete();

create or replace function private.recalculate_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id bigint;
begin
  v_order_id := coalesce(new.orden_id, old.orden_id);

  update public.ordenes
  set updated_at = now()
  where id = v_order_id;

  return coalesce(new, old);
end;
$$;

revoke all on function private.recalculate_order() from public;

create trigger trabajos_orden_recalculate
after insert or update or delete on public.trabajos_orden
for each row execute function private.recalculate_order();

create or replace function private.prepare_liquidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text;
begin
  v_actor := private.current_user_role();

  if auth.uid() is not null then
    if v_actor <> 'ADMIN' then
      raise exception 'Solo ADMIN puede crear o modificar liquidaciones';
    end if;
    if tg_op = 'INSERT' then
      new.created_by := auth.uid();
    end if;
  end if;

  if not exists (
    select 1 from public.perfiles p
    where p.id = new.mecanico_id
      and p.rol = 'MECANICO'
  ) then
    raise exception 'La liquidacion debe pertenecer a un mecanico';
  end if;

  if tg_op = 'UPDATE'
     and new.mecanico_id is distinct from old.mecanico_id
     and exists (
       select 1 from public.liquidacion_ordenes lo
       where lo.liquidacion_id = old.id
     ) then
    raise exception 'No se puede cambiar el mecanico de una liquidacion con ordenes';
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_liquidation() from public;

create trigger liquidaciones_prepare
before insert or update on public.liquidaciones
for each row execute function private.prepare_liquidation();

create or replace function private.prepare_liquidation_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_liq_mecanico uuid;
  v_orden_mecanico uuid;
  v_estado text;
  v_pago numeric(14,0);
begin
  select l.mecanico_id into v_liq_mecanico
  from public.liquidaciones l
  where l.id = new.liquidacion_id;

  if v_liq_mecanico is null then
    raise exception 'La liquidacion no existe';
  end if;

  select o.mecanico_id, o.estado, o.pago_mecanico
    into v_orden_mecanico, v_estado, v_pago
  from public.ordenes o
  where o.id = new.orden_id;

  if v_orden_mecanico is null then
    raise exception 'La orden no existe';
  end if;

  if v_estado <> 'TERMINADA' then
    raise exception 'Solo se pueden liquidar ordenes TERMINADAS';
  end if;

  if v_orden_mecanico <> v_liq_mecanico then
    raise exception 'La orden pertenece a otro mecanico';
  end if;

  new.monto_pagado := v_pago;
  return new;
end;
$$;

revoke all on function private.prepare_liquidation_order() from public;

create trigger liquidacion_ordenes_prepare
before insert or update on public.liquidacion_ordenes
for each row execute function private.prepare_liquidation_order();

create or replace function private.recalculate_liquidation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_liq_id bigint;
begin
  v_liq_id := coalesce(new.liquidacion_id, old.liquidacion_id);

  update public.liquidaciones l
  set total_pagado = (
        select coalesce(sum(lo.monto_pagado), 0)
        from public.liquidacion_ordenes lo
        where lo.liquidacion_id = v_liq_id
      ),
      updated_at = now()
  where l.id = v_liq_id;

  return coalesce(new, old);
end;
$$;

revoke all on function private.recalculate_liquidation() from public;

create trigger liquidacion_ordenes_recalculate
after insert or update or delete on public.liquidacion_ordenes
for each row execute function private.recalculate_liquidation();

alter table public.perfiles enable row level security;
alter table public.clientes enable row level security;
alter table public.motos enable row level security;
alter table public.tipos_trabajo enable row level security;
alter table public.ordenes enable row level security;
alter table public.trabajos_orden enable row level security;
alter table public.liquidaciones enable row level security;
alter table public.liquidacion_ordenes enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on public.perfiles to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.motos to authenticated;
grant select, insert, update, delete on public.tipos_trabajo to authenticated;
grant select, insert, update, delete on public.ordenes to authenticated;
grant select, insert, update, delete on public.trabajos_orden to authenticated;
grant select, insert, update, delete on public.liquidaciones to authenticated;
grant select, insert, update, delete on public.liquidacion_ordenes to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy perfiles_admin_all
on public.perfiles for all
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy perfiles_vendedor_select
on public.perfiles for select
to authenticated
using (
  private.current_user_role() = 'VENDEDOR'
  and (id = auth.uid() or (rol = 'MECANICO' and activo = true))
);

create policy perfiles_mecanico_select_self
on public.perfiles for select
to authenticated
using (
  private.current_user_role() = 'MECANICO'
  and id = auth.uid()
);

create policy clientes_admin_vendedor_select
on public.clientes for select
to authenticated
using (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy clientes_admin_vendedor_insert
on public.clientes for insert
to authenticated
with check (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy clientes_admin_vendedor_update
on public.clientes for update
to authenticated
using (private.current_user_role() in ('ADMIN','VENDEDOR'))
with check (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy clientes_admin_delete
on public.clientes for delete
to authenticated
using (private.current_user_role() = 'ADMIN');

create policy motos_admin_vendedor_select
on public.motos for select
to authenticated
using (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy motos_admin_vendedor_insert
on public.motos for insert
to authenticated
with check (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy motos_admin_vendedor_update
on public.motos for update
to authenticated
using (private.current_user_role() in ('ADMIN','VENDEDOR'))
with check (private.current_user_role() in ('ADMIN','VENDEDOR'));

create policy motos_admin_delete
on public.motos for delete
to authenticated
using (private.current_user_role() = 'ADMIN');

create policy tipos_trabajo_admin_select
on public.tipos_trabajo for select
to authenticated
using (private.current_user_role() = 'ADMIN');

create policy tipos_trabajo_vendedor_select
on public.tipos_trabajo for select
to authenticated
using (
  private.current_user_role() = 'VENDEDOR'
  and activo = true
);

create policy tipos_trabajo_admin_insert
on public.tipos_trabajo for insert
to authenticated
with check (private.current_user_role() = 'ADMIN');

create policy tipos_trabajo_admin_update
on public.tipos_trabajo for update
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy tipos_trabajo_admin_delete
on public.tipos_trabajo for delete
to authenticated
using (private.current_user_role() = 'ADMIN');

create policy ordenes_admin_all
on public.ordenes for all
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy ordenes_vendedor_select
on public.ordenes for select
to authenticated
using (private.current_user_role() = 'VENDEDOR');

create policy ordenes_vendedor_insert
on public.ordenes for insert
to authenticated
with check (
  private.current_user_role() = 'VENDEDOR'
  and vendedor_id = auth.uid()
);

create policy ordenes_vendedor_update
on public.ordenes for update
to authenticated
using (private.current_user_role() = 'VENDEDOR')
with check (private.current_user_role() = 'VENDEDOR');

create policy ordenes_mecanico_select
on public.ordenes for select
to authenticated
using (
  private.current_user_role() = 'MECANICO'
  and mecanico_id = auth.uid()
);

create policy trabajos_admin_all
on public.trabajos_orden for all
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy trabajos_vendedor_select
on public.trabajos_orden for select
to authenticated
using (private.current_user_role() = 'VENDEDOR');

create policy trabajos_vendedor_insert
on public.trabajos_orden for insert
to authenticated
with check (
  private.current_user_role() = 'VENDEDOR'
  and exists (
    select 1 from public.ordenes o
    where o.id = orden_id
      and o.estado <> 'TERMINADA'
  )
);

create policy trabajos_vendedor_update
on public.trabajos_orden for update
to authenticated
using (
  private.current_user_role() = 'VENDEDOR'
  and exists (
    select 1 from public.ordenes o
    where o.id = orden_id
      and o.estado <> 'TERMINADA'
  )
)
with check (
  private.current_user_role() = 'VENDEDOR'
  and exists (
    select 1 from public.ordenes o
    where o.id = orden_id
      and o.estado <> 'TERMINADA'
  )
);

create policy trabajos_vendedor_delete
on public.trabajos_orden for delete
to authenticated
using (
  private.current_user_role() = 'VENDEDOR'
  and exists (
    select 1 from public.ordenes o
    where o.id = orden_id
      and o.estado <> 'TERMINADA'
  )
);

create policy trabajos_mecanico_select
on public.trabajos_orden for select
to authenticated
using (
  private.current_user_role() = 'MECANICO'
  and exists (
    select 1 from public.ordenes o
    where o.id = orden_id
      and o.mecanico_id = auth.uid()
  )
);

create policy liquidaciones_admin_all
on public.liquidaciones for all
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');

create policy liquidacion_ordenes_admin_all
on public.liquidacion_ordenes for all
to authenticated
using (private.current_user_role() = 'ADMIN')
with check (private.current_user_role() = 'ADMIN');
;
