import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { karachiToday } from "@/lib/format/date"
import { digitsOnly, pageRange, sanitizeSearch, PAGE_SIZE } from "@/lib/search"
import type { OrderFilters } from "@/features/orders/schema"
import type { Tables, Views } from "@/types/database"

const IMAGE_BUCKET = "item-images"
const SIGNED_URL_TTL_SECONDS = 60 * 60

export type OrderListRow = Pick<
  Views<"order_overview">,
  | "id" | "order_number" | "bill_number" | "client_id" | "client_name" | "client_phone" | "client_city"
  | "delivery_deadline" | "order_date" | "status" | "is_archived" | "responsible_id" | "responsible_name"
  | "item_count" | "ready_count" | "item_preview" | "days_left" | "attention_level"
>

const LIST_COLUMNS =
  "id, order_number, bill_number, client_id, client_name, client_phone, client_city, delivery_deadline, order_date, status, is_archived, responsible_id, responsible_name, item_count, ready_count, item_preview, days_left, attention_level"

/** First instant of the current month in Karachi, as an ISO timestamp. */
export function karachiMonthStart(): string {
  return `${karachiToday().slice(0, 8)}01T00:00:00+05:00`
}

export async function listOrders(filters: OrderFilters, { isAdmin }: { isAdmin: boolean }) {
  const supabase = await createClient()
  const [from, to] = pageRange(filters.page ?? 1)

  let query = supabase.from("order_overview").select(LIST_COLUMNS, { count: "exact" })

  // Archive: hidden by default.
  if (filters.archived === "only") query = query.eq("is_archived", true)
  else if (filters.archived !== "include") query = query.eq("is_archived", false)

  // Status: open orders by default.
  if (!filters.status) query = query.not("status", "in", "(delivered,cancelled)")
  else if (filters.status !== "all") query = query.eq("status", filters.status)

  if (filters.attention) query = query.eq("attention_level", filters.attention)
  if (filters.responsible === "none") query = query.is("responsible_id", null)
  else if (filters.responsible) query = query.eq("responsible_id", filters.responsible)
  if (filters.from) query = query.gte("delivery_deadline", filters.from)
  if (filters.to) query = query.lte("delivery_deadline", filters.to)
  if (filters.delivered === "this-month") query = query.eq("status", "delivered").gte("delivered_at", karachiMonthStart())

  const term = sanitizeSearch(filters.q)
  if (term) {
    const digits = digitsOnly(term)
    const ors = [`client_name.ilike.%${term}%`, `order_number.ilike.%${term}%`, `bill_number.ilike.%${term}%`]
    if (digits.length >= 3) ors.push(`client_phone_digits.ilike.%${digits}%`, `order_number.ilike.%${digits}%`)
    query = query.or(ors.join(","))
  }

  switch (filters.sort) {
    case "urgency":
      query = query.order("attention_rank").order("delivery_deadline")
      break
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    case "deadline_desc":
      query = query.order("delivery_deadline", { ascending: false })
      break
    default:
      query = query.order("delivery_deadline").order("attention_rank")
  }
  query = query.order("order_number", { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(`listOrders: ${error.message}`)
  const rows: OrderListRow[] = data ?? []

  const balances = isAdmin ? await getRemainingBalances(rows.map((r) => r.id)) : new Map<string, number | null>()
  return { rows, total: count ?? 0, pageSize: PAGE_SIZE, balances }
}

/** Remaining balance per order (admin only; staff get an empty map from RLS). */
export async function getRemainingBalances(orderIds: string[]) {
  const map = new Map<string, number | null>()
  if (orderIds.length === 0) return map
  const supabase = await createClient()
  const { data, error } = await supabase.from("order_balances").select("order_id, remaining").in("order_id", orderIds)
  if (error) throw new Error(`getRemainingBalances: ${error.message}`)
  for (const row of data ?? []) if (row.order_id) map.set(row.order_id, row.remaining)
  return map
}

export type TeamMemberOption = Pick<Tables<"profiles">, "id" | "full_name" | "role">

/** Active portal users, for "person responsible". */
export async function listActiveTeam(): Promise<TeamMemberOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("is_active", true)
    .order("full_name")
  if (error) throw new Error(`listActiveTeam: ${error.message}`)
  return data ?? []
}

export type OrderItemRow = Tables<"order_items"> & { image_url: string | null }

async function signImages(paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))]
  const map = new Map<string, string>()
  if (unique.length === 0) return map
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS)
  if (error) {
    console.error("[orders] signing image URLs failed", error.message)
    return map
  }
  for (const entry of data ?? []) if (entry.path && entry.signedUrl) map.set(entry.path, entry.signedUrl)
  return map
}

async function getItems(orderId: string): Promise<OrderItemRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sort_order")
    .order("created_at")
  if (error) throw new Error(`getItems: ${error.message}`)
  const urls = await signImages((data ?? []).map((i) => i.image_path ?? ""))
  return (data ?? []).map((item) => ({ ...item, image_url: item.image_path ? (urls.get(item.image_path) ?? null) : null }))
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>

export async function getOrderDetail(orderId: string, { isAdmin }: { isAdmin: boolean }) {
  const supabase = await createClient()
  const { data: order, error } = await supabase.from("order_overview").select("*").eq("id", orderId).maybeSingle()
  if (error) throw new Error(`getOrderDetail: ${error.message}`)
  if (!order) return null

  const [client, items, notes, history, money] = await Promise.all([
    supabase.from("clients").select("id, name, phone, alt_phone, company, address, city").eq("id", order.client_id).maybeSingle(),
    getItems(orderId),
    supabase
      .from("order_notes")
      .select("id, body, created_at, author_id, author:profiles!order_notes_author_id_fkey(full_name)")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
    supabase
      .from("status_history")
      .select("id, from_status, to_status, changed_at, changed_by, person:profiles!status_history_changed_by_fkey(full_name)")
      .eq("order_id", orderId)
      .order("changed_at", { ascending: false })
      .order("id", { ascending: false }),
    isAdmin ? getOrderMoney(orderId) : Promise.resolve(null),
  ])
  if (client.error) throw new Error(`getOrderDetail client: ${client.error.message}`)
  if (notes.error) throw new Error(`getOrderDetail notes: ${notes.error.message}`)
  if (history.error) throw new Error(`getOrderDetail history: ${history.error.message}`)

  return {
    order,
    client: client.data,
    items,
    notes: (notes.data ?? []).map((n) => ({ id: n.id, body: n.body, created_at: n.created_at, author_id: n.author_id, author_name: n.author?.full_name ?? "Former user" })),
    history: (history.data ?? []).map((h) => ({
      id: h.id,
      from_status: h.from_status,
      to_status: h.to_status,
      changed_at: h.changed_at,
      person_name: h.person?.full_name ?? null,
    })),
    money,
  }
}

export type PaymentRow = Pick<Tables<"payments">, "id" | "amount" | "paid_on" | "method" | "note" | "created_at"> & {
  recorded_by_name: string | null
}

/** Admin only. Returns null if RLS hides the finance row (i.e. caller is not an admin). */
export async function getOrderMoney(orderId: string) {
  const supabase = await createClient()
  const [finance, payments] = await Promise.all([
    supabase.from("order_finance").select("order_amount, delivery_charges").eq("order_id", orderId).maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, paid_on, method, note, created_at, recorder:profiles!payments_recorded_by_fkey(full_name)")
      .eq("order_id", orderId)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ])
  if (finance.error) throw new Error(`getOrderMoney finance: ${finance.error.message}`)
  if (payments.error) throw new Error(`getOrderMoney payments: ${payments.error.message}`)
  if (!finance.data) return null
  return {
    orderAmount: finance.data.order_amount,
    deliveryCharges: finance.data.delivery_charges,
    payments: (payments.data ?? []).map(
      (p): PaymentRow => ({
        id: p.id,
        amount: p.amount,
        paid_on: p.paid_on,
        method: p.method,
        note: p.note,
        created_at: p.created_at,
        recorded_by_name: p.recorder?.full_name ?? null,
      })
    ),
  }
}

/** Everything the edit form needs, including signed URLs for existing photos. */
export async function getOrderForEdit(orderId: string) {
  const supabase = await createClient()
  const [{ data: order, error }, items, finance] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, client_id, bill_number, delivery_address, order_date, delivery_deadline, responsible_id, special_instructions, is_archived, status, client:clients!orders_client_id_fkey(id, name, phone, company, address, city), responsible:profiles!orders_responsible_id_fkey(full_name)")
      .eq("id", orderId)
      .maybeSingle(),
    getItems(orderId),
    supabase.from("order_finance").select("order_amount, delivery_charges").eq("order_id", orderId).maybeSingle(),
  ])
  if (error) throw new Error(`getOrderForEdit: ${error.message}`)
  if (!order) return null
  return { order, items, finance: finance.data ?? null }
}

/** Order number and client name, for page titles. */
export const getOrderTitle = cache(async (orderId: string): Promise<string | null> => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) return null
  const supabase = await createClient()
  const { data } = await supabase.from("order_overview").select("order_number, client_name").eq("id", orderId).maybeSingle()
  return data ? `${data.order_number} · ${data.client_name}` : null
})
