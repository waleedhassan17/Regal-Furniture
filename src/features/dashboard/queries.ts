import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { OrderListRow } from "@/features/orders/queries"

export type DashboardSummary = {
  overdue: number
  dueSoon: number
  needsToStart: number
  onTrack: number
  inProduction: number
  readyForDelivery: number
  deliveredThisMonth: number
  /** Admins only; null for staff. */
  outstandingBalance: number | null
  ordersWithBalance: number | null
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("dashboard_summary")
  if (error) throw new Error(`dashboard_summary: ${error.message}`)
  const row = data?.[0]
  return {
    overdue: row?.overdue ?? 0,
    dueSoon: row?.due_soon ?? 0,
    needsToStart: row?.needs_to_start ?? 0,
    onTrack: row?.on_track ?? 0,
    inProduction: row?.in_production ?? 0,
    readyForDelivery: row?.ready_for_delivery ?? 0,
    deliveredThisMonth: row?.delivered_this_month ?? 0,
    outstandingBalance: row?.outstanding_balance ?? null,
    ordersWithBalance: row?.orders_with_balance ?? null,
  }
}

export const NEEDS_ATTENTION_LIMIT = 12

/** Overdue, due soon and not-yet-started orders — most urgent first. */
export async function getNeedsAttention(): Promise<OrderListRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_overview")
    .select(
      "id, order_number, bill_number, client_id, client_name, client_phone, client_city, delivery_deadline, order_date, status, is_archived, responsible_id, responsible_name, item_count, ready_count, item_preview, days_left, attention_level"
    )
    .in("attention_level", ["overdue", "due_soon", "needs_to_start"])
    .order("attention_rank")
    .order("delivery_deadline")
    .order("order_number")
    .limit(NEEDS_ATTENTION_LIMIT)
  if (error) throw new Error(`getNeedsAttention: ${error.message}`)
  return data ?? []
}

/** The next deadline among on-track orders, for the "all clear" message. */
export async function getNextDeadline() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_overview")
    .select("id, order_number, client_name, delivery_deadline, days_left")
    .eq("attention_level", "on_track")
    .order("delivery_deadline")
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`getNextDeadline: ${error.message}`)
  return data
}
