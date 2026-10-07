/**
 * Recomputes every dashboard number with plain SQL written independently of
 * compute_attention / order_overview, and compares it with dashboard_summary()
 * called as a real admin (so RLS applies exactly as in the app).
 * Usage: npm run db:check-dashboard
 */
import { connectDatabase } from "./lib/db"

const INDEPENDENT = `
with t as (select (now() at time zone 'Asia/Karachi')::date as today),
     s as (select due_soon_days, start_warning_days, not_started_grace_days from public.settings where id = 1),
     open_orders as (
       select o.*, o.delivery_deadline - t.today as days_left,
              least(o.order_date, (o.created_at at time zone 'Asia/Karachi')::date) as received_on, t.today
       from public.orders o cross join t
       where not o.is_archived and o.status not in ('delivered', 'cancelled')
     ),
     balances as (
       select f.order_id,
              f.order_amount + f.delivery_charges - coalesce((select sum(p.amount) from public.payments p where p.order_id = f.order_id), 0) as remaining
       from public.order_finance f
       join public.orders o on o.id = f.order_id
       where f.order_amount is not null and not o.is_archived and o.status <> 'cancelled'
     )
select
  (select count(*) from open_orders where days_left < 0)::int as overdue,
  (select count(*) from open_orders, s where days_left between 0 and s.due_soon_days)::int as due_soon,
  (select count(*) from open_orders, s
     where days_left > s.due_soon_days and status = 'new'
       and (days_left <= s.start_warning_days or received_on < today - s.not_started_grace_days))::int as needs_to_start,
  (select count(*) from public.orders where status = 'in_production' and not is_archived)::int as in_production,
  (select count(*) from public.orders where status = 'ready_for_delivery' and not is_archived)::int as ready_for_delivery,
  (select count(*) from public.orders
     where status = 'delivered' and not is_archived
       and delivered_at >= date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi')::int as delivered_this_month,
  (select coalesce(sum(remaining), 0) from balances where remaining > 0)::bigint as outstanding_balance
`

const LABELS: Record<string, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  needs_to_start: "Needs to start",
  in_production: "In production",
  ready_for_delivery: "Ready for delivery",
  delivered_this_month: "Delivered this month",
  outstanding_balance: "Outstanding balance (Rs)",
}

async function main() {
  const db = await connectDatabase()
  try {
    const { rows: admins } = await db.query<{ id: string }>("select id from public.profiles where role = 'admin' and is_active limit 1")
    if (!admins[0]) throw new Error("No active admin found. Run `npm run create-admin` first.")

    const expected = (await db.query(INDEPENDENT)).rows[0] as Record<string, string | number>

    await db.query("begin")
    await db.query("set local role authenticated")
    await db.query("select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)", [
      JSON.stringify({ sub: admins[0].id, role: "authenticated" }),
      admins[0].id,
    ])
    const actual = (await db.query("select * from public.dashboard_summary()")).rows[0] as Record<string, string | number>
    await db.query("rollback")

    let mismatches = 0
    console.log("\nDashboard number              Dashboard   Direct SQL")
    console.log("─────────────────────────────────────────────────────")
    for (const key of Object.keys(LABELS)) {
      const a = Number(actual[key])
      const e = Number(expected[key])
      const ok = a === e
      if (!ok) mismatches++
      console.log(`${ok ? "✓" : "✗"} ${LABELS[key].padEnd(28)}${String(a).padStart(10)}${String(e).padStart(13)}`)
    }
    console.log(mismatches ? `\n✗ ${mismatches} number(s) differ.` : "\n✓ Every dashboard number matches the direct database query.")
    if (mismatches) process.exitCode = 1
  } finally {
    await db.end()
  }
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
