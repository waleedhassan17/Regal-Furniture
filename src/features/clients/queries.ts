import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { digitsOnly, pageRange, sanitizeSearch, PAGE_SIZE } from "@/lib/search"
import type { Tables, Views } from "@/types/database"

export type ClientListRow = Pick<Tables<"clients">, "id" | "name" | "phone" | "company" | "city"> & {
  order_count: number
}

export async function listClients({ q, page }: { q?: string; page: number }) {
  const supabase = await createClient()
  const term = sanitizeSearch(q)
  const [from, to] = pageRange(page)

  let query = supabase
    .from("clients")
    .select("id, name, phone, company, city, orders(count)", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to)

  if (term) {
    const digits = digitsOnly(term)
    const filters = [`name.ilike.%${term}%`, `company.ilike.%${term}%`, `city.ilike.%${term}%`]
    if (digits.length >= 3) filters.push(`phone_digits.ilike.%${digits}%`)
    query = query.or(filters.join(","))
  }

  const { data, error, count } = await query
  if (error) throw new Error(`listClients: ${error.message}`)

  const rows: ClientListRow[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    company: c.company,
    city: c.city,
    order_count: c.orders?.[0]?.count ?? 0,
  }))
  return { rows, total: count ?? 0, pageSize: PAGE_SIZE }
}

export type ClientOption = Pick<Tables<"clients">, "id" | "name" | "phone" | "company" | "address" | "city">

/** Quick lookup for the order form's client picker. */
export async function searchClientOptions(q: string): Promise<ClientOption[]> {
  const supabase = await createClient()
  const term = sanitizeSearch(q)
  let query = supabase.from("clients").select("id, name, phone, company, address, city").order("name").limit(8)
  if (term) {
    const digits = digitsOnly(term)
    const filters = [`name.ilike.%${term}%`, `company.ilike.%${term}%`]
    if (digits.length >= 3) filters.push(`phone_digits.ilike.%${digits}%`)
    query = query.or(filters.join(","))
  }
  const { data, error } = await query
  if (error) throw new Error(`searchClientOptions: ${error.message}`)
  return data ?? []
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(`getClient: ${error.message}`)
  return data
}

export type ClientOrderRow = Pick<
  Views<"order_overview">,
  | "id" | "order_number" | "bill_number" | "order_date" | "delivery_deadline" | "status" | "is_archived"
  | "days_left" | "attention_level" | "item_count" | "ready_count" | "item_preview"
>

export async function getClientOrders(clientId: string): Promise<ClientOrderRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_overview")
    .select("id, order_number, bill_number, order_date, delivery_deadline, status, is_archived, days_left, attention_level, item_count, ready_count, item_preview")
    .eq("client_id", clientId)
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw new Error(`getClientOrders: ${error.message}`)
  return data ?? []
}

/** Admin only — RLS returns nothing to staff. Remaining per order plus the client's total. */
export async function getClientBalances(clientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_balances")
    .select("order_id, grand_total, received, remaining, status, is_archived")
    .eq("client_id", clientId)
  if (error) throw new Error(`getClientBalances: ${error.message}`)
  const byOrder = new Map((data ?? []).map((b) => [b.order_id ?? "", b]))
  const outstanding = (data ?? [])
    .filter((b) => b.status !== "cancelled" && !b.is_archived && (b.remaining ?? 0) > 0)
    .reduce((sum, b) => sum + (b.remaining ?? 0), 0)
  const billed = (data ?? []).filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + (b.grand_total ?? 0), 0)
  const received = (data ?? []).reduce((sum, b) => sum + (b.received ?? 0), 0)
  return { byOrder, outstanding, billed, received }
}

/** Client name, for page titles. */
export const getClientTitle = cache(async (clientId: string): Promise<string | null> => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) return null
  const supabase = await createClient()
  const { data } = await supabase.from("clients").select("name").eq("id", clientId).maybeSingle()
  return data?.name ?? null
})
