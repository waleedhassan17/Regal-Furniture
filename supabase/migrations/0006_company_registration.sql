-- One-time company registration (owner's request, 2026-10-08).
-- The first person to register sets up Regal Furnitures and becomes its owner (admin).
-- Registration closes as soon as a company profile or any admin exists. Staff accounts
-- are still created by admins only.

create table public.company (
  id smallint primary key default 1 check (id = 1),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 160),
  address text check (char_length(address) <= 300),
  city text check (char_length(city) <= 80),
  website text check (char_length(website) <= 160),
  registered_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.company is 'Single row: the company that owns this portal.';

create trigger company_20_updated_at before update on public.company
  for each row execute function private.set_updated_at();

alter table public.company enable row level security;
revoke all on public.company from anon;
revoke truncate, references, trigger on public.company from authenticated;

create policy "Active users can read the company profile" on public.company
  for select to authenticated using ((select private.is_active_user()));
-- Installs set up with `npm run create-admin` have no company row yet; admins can add it.
create policy "Admins can add the company profile" on public.company
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update the company profile" on public.company
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Is registration still open? Safe to expose: it only says whether setup is done.
-- ---------------------------------------------------------------------------
create or replace function public.registration_open()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.company)
     and not exists (select 1 from public.profiles where role = 'admin');
$$;

revoke all on function public.registration_open() from public;
grant execute on function public.registration_open() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Registers the company and makes the given (already created) auth user its owner.
-- Called only by the server with the service role. Serialised with an advisory lock,
-- so two simultaneous registrations cannot both succeed.
-- ---------------------------------------------------------------------------
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

  if exists (select 1 from public.company) or exists (select 1 from public.profiles where role = 'admin') then
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

revoke all on function public.register_company(uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_company(uuid, text, text, text, text, text, text, text, text) to service_role;
