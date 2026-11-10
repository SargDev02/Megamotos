
alter table public.perfiles
  add column username text;

update public.perfiles
set username = lower(regexp_replace(btrim(nombre), '[^a-zA-Z0-9._-]+', '', 'g'))
where username is null;

alter table public.perfiles
  alter column username set not null;

alter table public.perfiles
  add constraint perfiles_username_formato_chk
  check (username ~ '^[a-z0-9._-]{3,30}$');

create unique index perfiles_username_uq
  on public.perfiles (lower(username));

create or replace function private.normalize_profile_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.username := lower(btrim(new.username));

  if tg_op = 'UPDATE' and new.username is distinct from old.username then
    raise exception 'El nombre de usuario no puede modificarse directamente';
  end if;

  return new;
end;
$$;

revoke all on function private.normalize_profile_username() from public;

create trigger perfiles_normalize_username
before insert or update on public.perfiles
for each row execute function private.normalize_profile_username();
;
