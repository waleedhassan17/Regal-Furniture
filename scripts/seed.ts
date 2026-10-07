/**
 * Inserts ~25 realistic demo orders (see seed-data.ts). Every row is flagged is_seed,
 * and seed staff accounts use @example.com addresses, so `npm run db:seed:clear`
 * removes exactly this data. Safe to re-run: it does nothing if seed data already exists.
 * Usage: npm run db:seed
 */
import { randomBytes } from "node:crypto"
import { karachiToday, addDays } from "../src/lib/format/date"
import { findUserByEmail, serviceClient } from "./lib/supabase"
import { SEED_CLIENTS, SEED_ORDERS, SEED_STAFF, type SeedOrder } from "./seed-data"
import type { Database } from "../src/types/database"

type Status = Database["public"]["Enums"]["production_status"]

const PATHS: Record<Status, Status[]> = {
  new: [],
  in_production: ["in_production"],
  ready_for_delivery: ["in_production", "ready_for_delivery"],
  delivered: ["in_production", "ready_for_delivery", "delivered"],
  on_hold: ["in_production", "on_hold"],
  cancelled: ["cancelled"],
}

const db = serviceClient()
const today = karachiToday()

/** A Karachi calendar date at a given hour, as an ISO timestamp. */
function at(date: string, hour = 11) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00+05:00`
}

function must<T>(result: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (result.error || result.data === null || result.data === undefined) {
    throw new Error(`${what}: ${result.error?.message ?? "no data returned"}`)
  }
  return result.data as NonNullable<T>
}

async function ensureStaff(): Promise<string[]> {
  const ids: string[] = []
  for (const person of SEED_STAFF) {
    let user = await findUserByEmail(db, person.email)
    if (!user) {
      const { data, error } = await db.auth.admin.createUser({
        email: person.email,
        password: randomBytes(24).toString("base64url"),
        email_confirm: true,
        user_metadata: { full_name: person.name, seed: true },
      })
      if (error || !data.user) throw new Error(`Could not create seed user ${person.name}: ${error?.message}`)
      user = data.user
    }
    const { error } = await db
      .from("profiles")
      .upsert({ id: user.id, full_name: person.name, phone: person.phone, role: "staff", is_active: true, is_seed: true }, { onConflict: "id" })
    if (error) throw new Error(`Could not save seed profile: ${error.message}`)
    ids.push(user.id)
  }
  return ids
}

async function createOrder(order: SeedOrder, clientIds: string[], staffIds: string[]) {
  const orderDate = addDays(today, -order.orderedDaysAgo)
  const deadline = addDays(today, order.deadlineInDays)
  const enteredOn = addDays(today, -(order.enteredDaysAgo ?? order.orderedDaysAgo))
  const responsible = order.responsible === undefined || order.responsible === null ? null : staffIds[order.responsible]
  const by = (i: number) => staffIds[i] ?? null

  const created = must(
    await db
      .from("orders")
      .insert({
        client_id: clientIds[order.client],
        order_date: orderDate,
        delivery_deadline: deadline,
        bill_number: order.bill ?? null,
        responsible_id: responsible,
        special_instructions: order.instructions ?? null,
        delivery_address: SEED_CLIENTS[order.client].address,
        status: "new",
        is_seed: true,
        created_at: at(enteredOn, 10),
      })
      .select("id, order_number")
      .single(),
    "insert order"
  )

  must(
    await db
      .from("order_items")
      .insert(
        order.items.map((item, index) => ({
          order_id: created.id,
          sort_order: index,
          name: item.name,
          quantity: item.quantity,
          size: item.size ?? null,
          sheet_code: item.sheet_code ?? null,
          metal_colour: item.metal_colour ?? null,
          pc: item.pc ?? null,
          rack: item.rack ?? null,
          fabric: item.fabric ?? null,
          leather: item.leather ?? null,
          foam: item.foam ?? null,
          railing: item.railing ?? null,
          lock: item.lock ?? null,
          note: item.note ?? null,
          status: item.status ?? (order.status === "delivered" ? "ready" : "pending"),
        }))
      )
      .select("id"),
    "insert items"
  )

  const subtotal = order.items.reduce((sum, i) => sum + i.unit * i.quantity, 0)
  const orderAmount = subtotal === 0 ? null : Math.round(subtotal / 1000) * 1000
  must(
    await db.from("order_finance").insert({ order_id: created.id, order_amount: orderAmount, delivery_charges: order.delivery ?? 0 }).select("order_id"),
    "insert finance"
  )

  if (orderAmount !== null && order.payments?.length) {
    const grand = orderAmount + (order.delivery ?? 0)
    must(
      await db
        .from("payments")
        .insert(
          order.payments.map((p) => ({
            order_id: created.id,
            amount: Math.round((grand * p.share) / 500) * 500,
            paid_on: addDays(today, -p.daysAgo),
            method: p.method,
            note: p.note ?? null,
            recorded_by: null,
          }))
        )
        .select("id"),
      "insert payments"
    )
  }

  // Walk the order through its statuses so the history trigger records each step,
  // then spread the history across the order's real timeline.
  const steps = PATHS[order.status]
  for (const step of steps) {
    must(await db.from("orders").update({ status: step }).eq("id", created.id).select("id"), `status ${step}`)
  }
  const history = must(await db.from("status_history").select("id").eq("order_id", created.id).order("id"), "history")
  const start = Date.parse(at(enteredOn, 10))
  const end = order.deliveredDaysAgo !== undefined ? Date.parse(at(addDays(today, -order.deliveredDaysAgo), 15)) : Date.now() - 3_600_000
  for (const [i, row] of history.entries()) {
    const when = i === 0 ? start : start + ((end - start) * i) / Math.max(1, history.length - 1)
    await db
      .from("status_history")
      .update({ changed_at: new Date(when).toISOString(), changed_by: i === 0 ? null : by(order.responsible ?? i % staffIds.length) })
      .eq("id", row.id)
  }

  const finalUpdate: Database["public"]["Tables"]["orders"]["Update"] = {}
  if (order.deliveredDaysAgo !== undefined) finalUpdate.delivered_at = at(addDays(today, -order.deliveredDaysAgo), 15)
  if (order.archived) finalUpdate.is_archived = true
  if (Object.keys(finalUpdate).length) must(await db.from("orders").update(finalUpdate).eq("id", created.id).select("id"), "final update")

  for (const note of order.notes ?? []) {
    must(
      await db
        .from("order_notes")
        .insert({ order_id: created.id, body: note.text, author_id: by(note.by), created_at: at(addDays(today, -note.daysAgo), 16) })
        .select("id"),
      "insert note"
    )
  }
  return created.order_number
}

async function main() {
  const { count, error } = await db.from("orders").select("id", { count: "exact", head: true }).eq("is_seed", true)
  if (error) throw new Error(`Could not check for existing seed data: ${error.message}`)
  if ((count ?? 0) > 0) {
    console.log(`Seed data is already present (${count} orders). Nothing to do. Run "npm run db:seed:clear" first to recreate it.`)
    return
  }

  console.log("Creating seed staff…")
  const staffIds = await ensureStaff()

  console.log("Creating clients…")
  const clients = must(
    await db
      .from("clients")
      .insert(SEED_CLIENTS.map((c) => ({ name: c.name, phone: c.phone, company: c.company, address: c.address, city: c.city, notes: "notes" in c ? c.notes : null, is_seed: true })))
      .select("id, name"),
    "insert clients"
  )
  const clientIds = SEED_CLIENTS.map((c) => clients.find((row) => row.name === c.name)?.id ?? "")

  console.log("Creating orders…")
  const numbers: string[] = []
  for (const order of SEED_ORDERS) numbers.push(await createOrder(order, clientIds, staffIds))

  console.log(`✓ Seeded ${SEED_CLIENTS.length} clients, ${SEED_STAFF.length} staff and ${numbers.length} orders (${numbers[0]} – ${numbers.at(-1)}).`)
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  console.error('  Partial seed data may exist. Run "npm run db:seed:clear" to remove it, then try again.')
  process.exit(1)
})
