-- Solo los usuarios autenticados pueden recibir esta invalidación genérica.
create policy "authenticated_receive_ordenes_invalidation"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() = 'megamotos:ordenes'
  and (select auth.uid()) is not null
);

create function public.broadcast_ordenes_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    payload => pg_catalog.jsonb_build_object('refresh', true),
    event => 'ordenes_changed',
    topic => 'megamotos:ordenes',
    private => true
  );
  return null;
end;
$$;

-- La función solo se ejecuta desde el trigger, no mediante RPC.
revoke all on function public.broadcast_ordenes_changed()
from public, anon, authenticated;

create trigger ordenes_broadcast_invalidation
after insert or update or delete on public.ordenes
for each row
execute function public.broadcast_ordenes_changed();
