-- Row Level Security. Roles come from public.profiles:
--   admin  — everything
--   staff  — read clients/orders/items/notes/history/settings, change order and
--            item status (column limits enforced by triggers), add notes
--   no active profile — nothing
-- Money (order_finance, payments) is admin-only.
-- Helper calls are wrapped in (select ...) so Postgres evaluates them once per statement.

-- Anonymous API users get nothing at all; signed-in users never get TRUNCATE etc.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke all on private.order_counters from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_finance enable row level security;
alter table public.payments enable row level security;
alter table public.order_items enable row level security;
alter table public.order_notes enable row level security;
alter table public.status_history enable row level security;

-- profiles --------------------------------------------------------------------
create policy "Active users can read profiles" on public.profiles
  for select to authenticated using ((select private.is_active_user()));
create policy "Admins can add profiles" on public.profiles
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update profiles" on public.profiles
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- settings --------------------------------------------------------------------
create policy "Active users can read settings" on public.settings
  for select to authenticated using ((select private.is_active_user()));
create policy "Admins can update settings" on public.settings
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- clients ---------------------------------------------------------------------
create policy "Active users can read clients" on public.clients
  for select to authenticated using ((select private.is_active_user()));
create policy "Admins can add clients" on public.clients
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update clients" on public.clients
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- orders ----------------------------------------------------------------------
create policy "Active users can read orders" on public.orders
  for select to authenticated using ((select private.is_active_user()));
create policy "Admins can add orders" on public.orders
  for insert to authenticated with check ((select private.is_admin()));
-- Staff may update open (non-archived) orders; the orders_10_guard trigger limits them to `status`.
create policy "Active users can update orders" on public.orders
  for update to authenticated
  using ((select private.is_admin()) or ((select private.is_active_user()) and not is_archived))
  with check ((select private.is_admin()) or ((select private.is_active_user()) and not is_archived));
-- No delete policy: orders are archived, never deleted.

-- order_items -----------------------------------------------------------------
create policy "Active users can read items" on public.order_items
  for select to authenticated using ((select private.is_active_user()));
create policy "Admins can add items" on public.order_items
  for insert to authenticated with check ((select private.is_admin()));
-- Staff may update items of open orders; the order_items_10_guard trigger limits them to `status`.
create policy "Active users can update items" on public.order_items
  for update to authenticated
  using (
    (select private.is_admin())
    or (
      (select private.is_active_user())
      and exists (select 1 from public.orders o where o.id = order_items.order_id and not o.is_archived)
    )
  )
  with check (
    (select private.is_admin())
    or (
      (select private.is_active_user())
      and exists (select 1 from public.orders o where o.id = order_items.order_id and not o.is_archived)
    )
  );
create policy "Admins can remove items" on public.order_items
  for delete to authenticated using ((select private.is_admin()));

-- order_finance (admin only) --------------------------------------------------
create policy "Admins can read order finance" on public.order_finance
  for select to authenticated using ((select private.is_admin()));
create policy "Admins can add order finance" on public.order_finance
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update order finance" on public.order_finance
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can remove order finance" on public.order_finance
  for delete to authenticated using ((select private.is_admin()));

-- payments (admin only) -------------------------------------------------------
create policy "Admins can read payments" on public.payments
  for select to authenticated using ((select private.is_admin()));
create policy "Admins can add payments" on public.payments
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update payments" on public.payments
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can remove payments" on public.payments
  for delete to authenticated using ((select private.is_admin()));

-- order_notes (append-only) ---------------------------------------------------
create policy "Active users can read notes" on public.order_notes
  for select to authenticated using ((select private.is_active_user()));
create policy "Active users can add their own notes" on public.order_notes
  for insert to authenticated
  with check ((select private.is_active_user()) and author_id = (select auth.uid()));
create policy "Admins can remove notes" on public.order_notes
  for delete to authenticated using ((select private.is_admin()));

-- status_history (written only by trigger) ------------------------------------
create policy "Active users can read status history" on public.status_history
  for select to authenticated using ((select private.is_active_user()));
revoke insert, update, delete on public.status_history from authenticated;
