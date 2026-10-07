-- Test and demo accounts (profiles.is_seed) are never real owners:
--   * they don't count as "already registered", so `npm run rls:check` on a fresh
--     project can't close registration before the owner signs up;
--   * the last-admin guard ignores them, so their temporary admin can be removed again.

create or replace function public.registration_open()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.company)
     and not exists (select 1 from public.profiles where role = 'admin' and not is_seed);
$$;

create or replace function public.register_company(
  p_owner_id uuid,
  p_owner_name text,
  p_owner_phone text,
  p_company_name text,
  p_company_phone text,
  p_company_email text,
  p_company_address text,
  p_company_city text,
  p_company_website text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('regal.company_registration'));

  if exists (select 1 from public.company)
     or exists (select 1 from public.profiles where role = 'admin' and not is_seed) then
    raise exception 'This portal has already been registered.' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, full_name, phone, role, is_active)
  values (p_owner_id, btrim(p_owner_name), nullif(btrim(p_owner_phone), ''), 'admin', true);

  insert into public.company (name, phone, email, address, city, website, registered_by)
  values (
    btrim(p_company_name),
    nullif(btrim(p_company_phone), ''),
    nullif(btrim(p_company_email), ''),
    nullif(btrim(p_company_address), ''),
    nullif(btrim(p_company_city), ''),
    nullif(btrim(p_company_website), ''),
    p_owner_id
  );
end;
$$;

create or replace function private.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_losing_admin boolean;
begin
  -- Test and demo accounts are never what keeps the portal administrable.
  if old.is_seed then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_losing_admin := old.role = 'admin' and old.is_active;
  else
    v_losing_admin := old.role = 'admin' and old.is_active
      and (new.role <> 'admin' or not new.is_active);
  end if;

  if v_losing_admin then
    -- Serialise concurrent demotions so two admins cannot remove each other at once.
    perform pg_advisory_xact_lock(hashtext('regal.last_admin_guard'));
    if not exists (
      select 1 from public.profiles
      where role = 'admin' and is_active and not is_seed and id <> old.id
    ) then
      raise exception 'At least one active admin is required.' using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
