/**
 * Proves the database enforces the roles in SPEC §5 by signing in as real users
 * through the public API (anon key + RLS), exactly as the browser would.
 *
 * Creates temporary users (admin, staff, no-profile) and a temporary order, runs the
 * checks, prints a report, and removes everything it created.
 * Usage: npm run rls:check
 */
import { randomBytes, randomUUID } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../src/types/database"
import { anonClient, serviceClient } from "./lib/supabase"

type Client = SupabaseClient<Database>
type Result = { group: string; check: string; pass: boolean; detail?: string }

const results: Result[] = []
const tag = `rls-check-${Date.now()}`

function record(group: string, check: string, pass: boolean, detail?: string) {
  results.push({ group, check, pass, detail })
}

async function expectRows(group: string, check: string, run: () => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>, expect: "some" | "none") {
  const { data, error } = await run()
  const count = data?.length ?? 0
  if (expect === "none") {
    record(group, check, !!error || count === 0, error ? "refused" : `${count} rows`)
  } else {
    record(group, check, !error && count > 0, error ? error.message : `${count} rows`)
  }
}

async function expectRefused(group: string, check: string, run: () => PromiseLike<{ data: unknown; error: { message: string } | null; count?: number | null }>) {
  const { data, error } = await run()
  const affected = Array.isArray(data) ? data.length : data ? 1 : 0
  record(group, check, !!error || affected === 0, error ? "refused" : `${affected} rows changed`)
}

async function signIn(email: string, password: string): Promise<Client> {
  const client = anonClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign-in failed for a temporary user: ${error.message}`)
  return client
}

async function main() {
  const service = serviceClient()
  const password = randomBytes(18).toString("base64url")
  const users: Record<"admin" | "staff" | "nobody", { id: string; email: string }> = {
    admin: { id: "", email: `${tag}-admin@example.com` },
    staff: { id: "", email: `${tag}-staff@example.com` },
    nobody: { id: "", email: `${tag}-nobody@example.com` },
  }
  const orderId = randomUUID()
  let clientId = ""

  try {
    // --- fixtures (service role) ---------------------------------------------
    for (const key of Object.keys(users) as (keyof typeof users)[]) {
      const { data, error } = await service.auth.admin.createUser({ email: users[key].email, password, email_confirm: true })
      if (error || !data.user) throw new Error(`Could not create temporary user: ${error?.message}`)
      users[key].id = data.user.id
    }
    const { error: pErr } = await service.from("profiles").insert([
      { id: users.admin.id, full_name: "RLS Check Admin", role: "admin", is_seed: true },
      { id: users.staff.id, full_name: "RLS Check Staff", role: "staff", is_seed: true },
    ])
    if (pErr) throw new Error(`Could not create profiles: ${pErr.message}`)

    const { data: client, error: cErr } = await service
      .from("clients")
      .insert({ name: `[${tag}] Client`, phone: "0300-0000000", is_seed: true })
      .select("id")
      .single()
    if (cErr || !client) throw new Error(`Could not create client: ${cErr?.message}`)
    clientId = client.id

    const { error: oErr } = await service.from("orders").insert({
      id: orderId,
      client_id: clientId,
      delivery_deadline: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10),
      is_seed: true,
    })
    if (oErr) throw new Error(`Could not create order: ${oErr.message}`)
    await service.from("order_items").insert({ order_id: orderId, name: "Test table", quantity: 1 })
    await service.from("order_finance").insert({ order_id: orderId, order_amount: 100000, delivery_charges: 2000 })
    await service.from("payments").insert({ order_id: orderId, amount: 25000 })

    const admin = await signIn(users.admin.email, password)
    const staff = await signIn(users.staff.email, password)
    const nobody = await signIn(users.nobody.email, password)
    const anon = anonClient()

    // --- admin ---------------------------------------------------------------
    const A = "Admin"
    await expectRows(A, "reads orders", () => admin.from("orders").select("id").eq("id", orderId), "some")
    await expectRows(A, "reads order_finance", () => admin.from("order_finance").select("order_id").eq("order_id", orderId), "some")
    await expectRows(A, "reads payments", () => admin.from("payments").select("id").eq("order_id", orderId), "some")
    await expectRows(A, "reads order_balances", () => admin.from("order_balances").select("order_id").eq("order_id", orderId), "some")
    {
      const { error } = await admin.from("payments").insert({ order_id: orderId, amount: 1000 })
      record(A, "adds a payment", !error, error?.message)
    }

    // --- staff ---------------------------------------------------------------
    const S = "Staff"
    await expectRows(S, "reads orders", () => staff.from("orders").select("id").eq("id", orderId), "some")
    await expectRows(S, "reads order items", () => staff.from("order_items").select("id").eq("order_id", orderId), "some")
    await expectRows(S, "cannot read order_finance", () => staff.from("order_finance").select("*"), "none")
    await expectRows(S, "cannot read payments", () => staff.from("payments").select("*"), "none")
    await expectRows(S, "cannot read order_balances", () => staff.from("order_balances").select("*"), "none")
    {
      const { data } = await staff.rpc("dashboard_summary")
      record(S, "dashboard hides outstanding balance", (data?.[0]?.outstanding_balance ?? null) === null)
    }
    await expectRefused(S, "cannot add a payment", () => staff.from("payments").insert({ order_id: orderId, amount: 1 }).select())
    await expectRefused(S, "cannot change a payment", () => staff.from("payments").update({ amount: 1 }).eq("order_id", orderId).select())
    await expectRefused(S, "cannot delete payments", () => staff.from("payments").delete().eq("order_id", orderId).select())
    await expectRefused(S, "cannot change order_finance", () =>
      staff.from("order_finance").update({ order_amount: 1 }).eq("order_id", orderId).select()
    )
    await expectRefused(S, "cannot insert order_finance", () =>
      staff.from("order_finance").upsert({ order_id: orderId, order_amount: 1 }).select()
    )
    await expectRefused(S, "cannot edit order details", () => staff.from("orders").update({ bill_number: "HACK" }).eq("id", orderId).select())
    await expectRefused(S, "cannot archive orders", () => staff.from("orders").update({ is_archived: true }).eq("id", orderId).select())
    await expectRefused(S, "cannot create orders (save_order)", () =>
      staff.rpc("save_order", { payload: { id: randomUUID(), client_id: clientId, items: [] } })
    )
    await expectRefused(S, "cannot create clients", () => staff.from("clients").insert({ name: "Nope" }).select())
    await expectRefused(S, "cannot promote themselves", () => staff.from("profiles").update({ role: "admin" }).eq("id", users.staff.id).select())
    await expectRefused(S, "cannot change settings", () => staff.from("settings").update({ due_soon_days: 9 }).eq("id", 1).select())
    {
      const { data, error } = await staff.from("orders").update({ status: "in_production" }).eq("id", orderId).select("status")
      record(S, "can change production status", !error && data?.[0]?.status === "in_production", error?.message)
    }
    {
      const { error } = await staff.from("order_notes").insert({ order_id: orderId, body: "Started cutting." })
      record(S, "can add a note", !error, error?.message)
    }
    {
      const { error } = await staff.storage.from("item-images").upload(`orders/${orderId}/x/test.jpg`, new Blob(["x"], { type: "image/jpeg" }))
      record(S, "cannot upload item images", !!error, error ? "refused" : "uploaded")
    }

    await expectRefused(S, "cannot change company details", () => staff.from("company").update({ name: "Hacked" }).eq("id", 1).select())

    // --- signed in, no profile -----------------------------------------------
    const N = "No profile"
    for (const table of ["profiles", "settings", "clients", "orders", "order_items", "order_notes", "status_history", "order_finance", "payments"] as const) {
      await expectRows(N, `reads nothing from ${table}`, () => nobody.from(table).select("*").limit(5), "none")
    }
    await expectRows(N, "reads nothing from order_overview", () => nobody.from("order_overview").select("id").limit(5), "none")

    await expectRows(N, "reads nothing from company", () => nobody.from("company").select("*"), "none")

    // --- not signed in ---------------------------------------------------------
    const X = "Anonymous"
    {
      const { data, error } = await anon.rpc("registration_open")
      record(X, "can ask whether registration is open", !error && typeof data === "boolean", error?.message)
    }
    {
      const { error } = await anon.rpc("register_company", {
        p_owner_id: randomUUID(),
        p_owner_name: "Intruder",
        p_owner_phone: "",
        p_company_name: "Intruder Co",
        p_company_phone: "",
        p_company_email: "",
        p_company_address: "",
        p_company_city: "",
        p_company_website: "",
      })
      record(X, "cannot call register_company directly", !!error, error ? "refused" : "ran")
    }
    for (const table of ["clients", "orders", "order_finance", "payments", "profiles", "company"] as const) {
      await expectRows(X, `reads nothing from ${table}`, () => anon.from(table).select("*").limit(5), "none")
    }
  } finally {
    // --- cleanup -------------------------------------------------------------
    await service.from("orders").delete().eq("id", orderId)
    if (clientId) await service.from("clients").delete().eq("id", clientId)
    for (const u of Object.values(users)) if (u.id) await service.auth.admin.deleteUser(u.id)
  }

  // --- report ------------------------------------------------------------------
  let group = ""
  for (const r of results) {
    if (r.group !== group) {
      group = r.group
      console.log(`\n${group}`)
    }
    console.log(`  ${r.pass ? "✓" : "✗"} ${r.check}${r.detail ? `  (${r.detail})` : ""}`)
  }
  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed. Temporary users and data removed.`)
  if (failed.length) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
