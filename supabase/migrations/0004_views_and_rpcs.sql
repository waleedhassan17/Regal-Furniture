-- Read models and RPCs.
--   compute_attention  — the single source of the attention rules (SPEC §4)
--   order_overview     — orders + client + items summary + days left + attention (no money)
--   order_balances     — admin-only money per order (RLS on the base tables hides it from staff)
--   dashboard_summary  — the dashboard counts in one round trip
--   save_order         — atomic create/update of an order with its items and amounts

-- ---------------------------------------------------------------------------
-- Attention level. Pure: every input is an argument, so it is easy to test at
-- the boundaries. First match wins; closed orders (delivered, cancelled,
-- archived) have no attention level.
-- ---------------------------------------------------------------------------
create or replace function public.compute_attention(
  p_status public.production_status,
  p_is_archived boolean,
  p_deadline date,
  p_received_on date,
  p_today date,
  p_due_soon_days integer,
  p_start_warning_days integer,
  p_grace_days integer
)
returns public.attention_level
language sql
immutable
set search_path = ''
as $$
  select case
    when p_is_archived or p_status in ('delivered', 'cancelled') then null
    when p_deadline < p_today then 'overdue'
    when p_deadline - p_today <= p_due_soon_days then 'due_soon'
    when p_status = 'new'
      and (p_deadline - p_today <= p_start_warning_days or p_received_on < p_today - p_grace_days)
      then 'needs_to_start'
    else 'on_track'
  end::public.attention_level;
$$;

comment on function public.compute_attention is
  'Attention rules (SPEC §4). p_received_on is the earlier of the order date and the day the order was entered.';

create or replace function public.attention_rank(p_level public.attention_level)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_level
    when 'overdue' then 1
    when 'due_soon' then 2
    when 'needs_to_start' then 3
    when 'on_track' then 4
    else 5
  end;
$$;

-- ---------------------------------------------------------------------------
-- order_overview
-- ---------------------------------------------------------------------------
create or replace view public.order_overview
with (security_invoker = true)
as
select
  o.id,
  o.order_number,
  o.bill_number,
  o.client_id,
  c.name as client_name,
  c.phone as client_phone,
  c.phone_digits as client_phone_digits,
  c.company as client_company,
  c.city as client_city,
  o.delivery_address,
  o.order_date,
  o.delivery_deadline,
  o.status,
  o.delivered_at,
  o.responsible_id,
  r.full_name as responsible_name,
  o.special_instructions,
  o.is_archived,
  o.archived_at,
  o.is_seed,
  o.created_by,
  o.created_at,
  o.updated_at,
  coalesce(i.item_count, 0) as item_count,
  coalesce(i.ready_count, 0) as ready_count,
  coalesce(i.total_quantity, 0) as total_quantity,
  coalesce(i.item_preview, '{}') as item_preview,
  (o.delivery_deadline - t.today) as days_left,
  a.level as attention_level,
  public.attention_rank(a.level) as attention_rank
from public.orders o
join public.clients c on c.id = o.client_id
left join public.profiles r on r.id = o.responsible_id
left join public.settings s on s.id = 1
cross join lateral (select private.karachi_today() as today) t
left join lateral (
  select
    count(*)::integer as item_count,
    (count(*) filter (where it.status = 'ready'))::integer as ready_count,
    coalesce(sum(it.quantity), 0)::integer as total_quantity,
    (array_agg(
      it.name || case when it.quantity > 1 then ' × ' || it.quantity::text else '' end
      order by it.sort_order, it.created_at
    ))[1:3] as item_preview
  from public.order_items it
  where it.order_id = o.id
) i on true
cross join lateral (
  select public.compute_attention(
    o.status,
    o.is_archived,
    o.delivery_deadline,
    least(o.order_date, (o.created_at at time zone 'Asia/Karachi')::date),
    t.today,
    coalesce(s.due_soon_days, 3),
    coalesce(s.start_warning_days, 10),
    coalesce(s.not_started_grace_days, 2)
  ) as level
) a;

-- ---------------------------------------------------------------------------
-- order_balances (admin only via RLS on order_finance and payments)
-- ---------------------------------------------------------------------------
create or replace view public.order_balances
with (security_invoker = true)
as
select
  f.order_id,
  o.client_id,
  o.status,
  o.is_archived,
  f.order_amount,
  f.delivery_charges,
  case when f.order_amount is null then null else f.order_amount + f.delivery_charges end as grand_total,
  coalesce(p.received, 0)::bigint as received,
  case
    when f.order_amount is null then null
    else f.order_amount + f.delivery_charges - coalesce(p.received, 0)
  end::bigint as remaining
from public.order_finance f
join public.orders o on o.id = f.order_id
left join lateral (
  select sum(pm.amount) as received from public.payments pm where pm.order_id = f.order_id
) p on true;

-- ---------------------------------------------------------------------------
-- dashboard_summary
-- Outstanding balance counts every order that still owes money (including
-- delivered ones), excluding cancelled and archived orders. NULL for staff.
-- ---------------------------------------------------------------------------
create or replace function public.dashboard_summary()
returns table (
  overdue integer,
  due_soon integer,
  needs_to_start integer,
  on_track integer,
  in_production integer,
  ready_for_delivery integer,
  delivered_this_month integer,
  outstanding_balance bigint,
  orders_with_balance integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with month_start as (
    select (date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi') as ts
  ),
  counts as (
    select
      (count(*) filter (where v.attention_level = 'overdue'))::integer as overdue,
      (count(*) filter (where v.attention_level = 'due_soon'))::integer as due_soon,
      (count(*) filter (where v.attention_level = 'needs_to_start'))::integer as needs_to_start,
      (count(*) filter (where v.attention_level = 'on_track'))::integer as on_track,
      (count(*) filter (where v.status = 'in_production' and not v.is_archived))::integer as in_production,
      (count(*) filter (where v.status = 'ready_for_delivery' and not v.is_archived))::integer as ready_for_delivery,
      (count(*) filter (
        where v.status = 'delivered' and not v.is_archived
          and v.delivered_at >= (select ts from month_start)
      ))::integer as delivered_this_month
    from public.order_overview v
  ),
  money as (
    select
      coalesce(sum(b.remaining) filter (where b.remaining > 0), 0)::bigint as outstanding_balance,
      (count(*) filter (where b.remaining > 0))::integer as orders_with_balance
    from public.order_balances b
    where not b.is_archived and b.status <> 'cancelled'
  )
  select
    c.overdue, c.due_soon, c.needs_to_start, c.on_track, c.in_production,
    c.ready_for_delivery, c.delivered_this_month,
    case when private.is_admin() then m.outstanding_balance end,
    case when private.is_admin() then m.orders_with_balance end
  from counts c cross join money m;
$$;

-- ---------------------------------------------------------------------------
-- save_order: create or update an order, its items and its amounts in one
-- transaction. Runs as the caller, so RLS and the table constraints apply.
-- Item status is preserved on edit; new items start as Pending.
-- ---------------------------------------------------------------------------
create or replace function public.save_order(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
  v_items jsonb := payload -> 'items';
  v_finance jsonb := payload -> 'finance';
  v_item_ids uuid[];
begin
  if not private.is_admin() then
    raise exception 'Only an admin can create or edit orders.' using errcode = '42501';
  end if;
  if v_id is null then
    raise exception 'Order id is required.' using errcode = '22023';
  end if;
  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'An order needs at least one item.' using errcode = '22023';
  end if;

  if exists (select 1 from public.orders where id = v_id) then
    update public.orders set
      client_id = (payload ->> 'client_id')::uuid,
      bill_number = nullif(btrim(payload ->> 'bill_number'), ''),
      delivery_address = nullif(btrim(payload ->> 'delivery_address'), ''),
      order_date = (payload ->> 'order_date')::date,
      delivery_deadline = (payload ->> 'delivery_deadline')::date,
      responsible_id = nullif(payload ->> 'responsible_id', '')::uuid,
      special_instructions = nullif(btrim(payload ->> 'special_instructions'), '')
    where id = v_id;
  else
    insert into public.orders (
      id, client_id, bill_number, delivery_address, order_date, delivery_deadline,
      responsible_id, special_instructions
    ) values (
      v_id,
      (payload ->> 'client_id')::uuid,
      nullif(btrim(payload ->> 'bill_number'), ''),
      nullif(btrim(payload ->> 'delivery_address'), ''),
      coalesce((payload ->> 'order_date')::date, private.karachi_today()),
      (payload ->> 'delivery_deadline')::date,
      nullif(payload ->> 'responsible_id', '')::uuid,
      nullif(btrim(payload ->> 'special_instructions'), '')
    );
  end if;

  select coalesce(array_agg((e.item ->> 'id')::uuid), '{}')
  into v_item_ids
  from jsonb_array_elements(v_items) as e(item);

  if exists (
    select 1 from public.order_items where id = any (v_item_ids) and order_id <> v_id
  ) then
    raise exception 'An item belongs to a different order.' using errcode = '22023';
  end if;

  delete from public.order_items where order_id = v_id and not (id = any (v_item_ids));

  insert into public.order_items as oi (
    id, order_id, sort_order, name, quantity, size, sheet_code, metal_colour, pc, rack,
    fabric, leather, foam, railing, lock, note, image_path
  )
  select
    (e.item ->> 'id')::uuid,
    v_id,
    (e.ord - 1)::integer,
    btrim(e.item ->> 'name'),
    (e.item ->> 'quantity')::integer,
    nullif(btrim(e.item ->> 'size'), ''),
    nullif(btrim(e.item ->> 'sheet_code'), ''),
    nullif(btrim(e.item ->> 'metal_colour'), ''),
    nullif(btrim(e.item ->> 'pc'), ''),
    nullif(btrim(e.item ->> 'rack'), ''),
    nullif(btrim(e.item ->> 'fabric'), ''),
    nullif(btrim(e.item ->> 'leather'), ''),
    nullif(btrim(e.item ->> 'foam'), ''),
    nullif(btrim(e.item ->> 'railing'), ''),
    nullif(btrim(e.item ->> 'lock'), ''),
    nullif(btrim(e.item ->> 'note'), ''),
    nullif(e.item ->> 'image_path', '')
  from jsonb_array_elements(v_items) with ordinality as e(item, ord)
  on conflict (id) do update set
    sort_order = excluded.sort_order,
    name = excluded.name,
    quantity = excluded.quantity,
    size = excluded.size,
    sheet_code = excluded.sheet_code,
    metal_colour = excluded.metal_colour,
    pc = excluded.pc,
    rack = excluded.rack,
    fabric = excluded.fabric,
    leather = excluded.leather,
    foam = excluded.foam,
    railing = excluded.railing,
    lock = excluded.lock,
    note = excluded.note,
    image_path = excluded.image_path;

  insert into public.order_finance (order_id, order_amount, delivery_charges)
  values (
    v_id,
    nullif(v_finance ->> 'order_amount', '')::bigint,
    coalesce(nullif(v_finance ->> 'delivery_charges', '')::bigint, 0)
  )
  on conflict (order_id) do update set
    order_amount = excluded.order_amount,
    delivery_charges = excluded.delivery_charges;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: nothing for anon; signed-in users go through RLS.
-- ---------------------------------------------------------------------------
revoke all on public.order_overview, public.order_balances from anon;
grant select on public.order_overview, public.order_balances to authenticated;

revoke all on function public.compute_attention(public.production_status, boolean, date, date, date, integer, integer, integer) from public, anon;
revoke all on function public.attention_rank(public.attention_level) from public, anon;
revoke all on function public.dashboard_summary() from public, anon;
revoke all on function public.save_order(jsonb) from public, anon;
grant execute on function public.compute_attention(public.production_status, boolean, date, date, date, integer, integer, integer) to authenticated, service_role;
grant execute on function public.attention_rank(public.attention_level) to authenticated, service_role;
grant execute on function public.dashboard_summary() to authenticated, service_role;
grant execute on function public.save_order(jsonb) to authenticated, service_role;
