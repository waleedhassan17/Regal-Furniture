-- Behaviour enforced by the database: timestamps, order numbers, status history,
-- staff write limits and the last-admin guard.

-- ---------------------------------------------------------------------------
-- Identity helpers used by RLS policies. SECURITY DEFINER so they can read
-- profiles regardless of the caller's own policies; search_path pinned.
-- ---------------------------------------------------------------------------
create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active and p.role = 'admin'
  );
$$;

-- True for API callers (signed-in users or anonymous). Scripts and migrations
-- (postgres / service_role) are trusted and skip the per-user write guards.
create or replace function private.is_api_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('authenticated', 'anon');
$$;

create or replace function private.karachi_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Karachi')::date;
$$;

revoke all on function private.is_active_user() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.is_api_user() from public;
revoke all on function private.karachi_today() from public;
grant execute on function private.is_active_user() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_api_user() to authenticated, service_role;
grant execute on function private.karachi_today() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
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

create trigger profiles_20_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger settings_20_updated_at before update on public.settings
  for each row execute function private.set_updated_at();
create trigger clients_20_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger orders_20_updated_at before update on public.orders
  for each row execute function private.set_updated_at();
create trigger order_finance_20_updated_at before update on public.order_finance
  for each row execute function private.set_updated_at();
create trigger payments_20_updated_at before update on public.payments
  for each row execute function private.set_updated_at();
create trigger order_items_20_updated_at before update on public.order_items
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Order numbers: RF-YYYY-NNNN, sequential per Karachi calendar year.
-- The counter row is locked by the upsert, so concurrent inserts never collide.
-- ---------------------------------------------------------------------------
create or replace function private.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from (now() at time zone 'Asia/Karachi'))::integer;
  v_next integer;
begin
  insert into private.order_counters as c (year, last_value)
  values (v_year, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into v_next;

  new.order_number := 'RF-' || v_year::text || '-' ||
    case when v_next < 10000 then lpad(v_next::text, 4, '0') else v_next::text end;
  return new;
end;
$$;

create trigger orders_05_assign_number before insert on public.orders
  for each row execute function private.assign_order_number();

-- ---------------------------------------------------------------------------
-- Staff write limits. Admins (and trusted scripts) may change anything except
-- the order number; staff may change only the status column.
-- ---------------------------------------------------------------------------
create or replace function private.guard_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.order_number is distinct from old.order_number then
    raise exception 'The order number cannot be changed.' using errcode = '42501';
  end if;

  if not private.is_api_user() or private.is_admin() then
    return new;
  end if;

  if (to_jsonb(new) - array['status', 'updated_at'])
     is distinct from (to_jsonb(old) - array['status', 'updated_at']) then
    raise exception 'Only an admin can change order details.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger orders_10_guard before update on public.orders
  for each row execute function private.guard_order_update();

create or replace function private.guard_item_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_api_user() or private.is_admin() then
    return new;
  end if;

  if (to_jsonb(new) - array['status', 'updated_at'])
     is distinct from (to_jsonb(old) - array['status', 'updated_at']) then
    raise exception 'Only an admin can change item details.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger order_items_10_guard before update on public.order_items
  for each row execute function private.guard_item_update();

-- ---------------------------------------------------------------------------
-- Derived order timestamps: delivered_at follows the Delivered status,
-- archived_at follows the archived flag.
-- ---------------------------------------------------------------------------
create or replace function private.maintain_order_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'delivered' then
    if tg_op = 'INSERT' then
      new.delivered_at := coalesce(new.delivered_at, now());
    elsif old.status is distinct from 'delivered' then
      new.delivered_at := now();
    end if;
  else
    new.delivered_at := null;
  end if;

  if new.is_archived then
    if tg_op = 'INSERT' then
      new.archived_at := coalesce(new.archived_at, now());
    elsif not old.is_archived then
      new.archived_at := now();
    end if;
  else
    new.archived_at := null;
  end if;

  return new;
end;
$$;

create trigger orders_30_timestamps before insert or update on public.orders
  for each row execute function private.maintain_order_timestamps();

-- ---------------------------------------------------------------------------
-- Status history: every insert and every status change is recorded.
-- SECURITY DEFINER because users have no write access to status_history.
-- ---------------------------------------------------------------------------
create or replace function private.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end;
$$;

create trigger orders_40_status_history after insert or update of status on public.orders
  for each row execute function private.record_status_change();

-- ---------------------------------------------------------------------------
-- There must always be at least one active admin.
-- ---------------------------------------------------------------------------
create or replace function private.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_losing_admin boolean;
begin
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
      where role = 'admin' and is_active and id <> old.id
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

create trigger profiles_10_last_admin before update or delete on public.profiles
  for each row execute function private.guard_last_admin();
