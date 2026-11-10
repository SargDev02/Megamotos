do $migration$
declare
  v_table text;
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
      and not puballtables
  ) then
    raise exception 'La publicación supabase_realtime no existe o usa FOR ALL TABLES';
  end if;

  foreach v_table in array array[
    'ordenes',
    'trabajos_orden',
    'clientes',
    'motos',
    'perfiles',
    'tipos_trabajo',
    'marcas_moto',
    'liquidaciones',
    'liquidacion_ordenes',
    'prestamos_mecanicos',
    'liquidacion_prestamos'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise exception 'No existe public.%', v_table;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end;
$migration$;;
