/**
 * Removes the demo data created by `npm run db:seed` — and nothing else:
 * orders, clients and profiles flagged is_seed, the seed staff logins, and any photos
 * stored under seed orders. Real orders and clients are never touched.
 * Usage: npm run db:seed:clear
 */
import { serviceClient } from "./lib/supabase"
import { connectDatabase } from "./lib/db"

const BUCKET = "item-images"
const db = serviceClient()

async function removeOrderPhotos(orderId: string) {
  const folder = `orders/${orderId}`
  const { data: itemFolders } = await db.storage.from(BUCKET).list(folder, { limit: 1000 })
  const paths: string[] = []
  for (const entry of itemFolders ?? []) {
    const { data: files } = await db.storage.from(BUCKET).list(`${folder}/${entry.name}`, { limit: 1000 })
    for (const file of files ?? []) paths.push(`${folder}/${entry.name}/${file.name}`)
  }
  if (paths.length) await db.storage.from(BUCKET).remove(paths)
  return paths.length
}

async function main() {
  const { data: orders, error } = await db.from("orders").select("id").eq("is_seed", true)
  if (error) throw new Error(`Could not read seed orders: ${error.message}`)

  let photos = 0
  for (const order of orders ?? []) photos += await removeOrderPhotos(order.id)

  if (orders?.length) {
    const { error: delError } = await db.from("orders").delete().eq("is_seed", true)
    if (delError) throw new Error(`Could not delete seed orders: ${delError.message}`)
  }

  // A seed client that now has a real order is kept, so real data never loses its client.
  const { data: clients } = await db.from("clients").select("id, name, orders(count)").eq("is_seed", true)
  const removable = (clients ?? []).filter((c) => (c.orders?.[0]?.count ?? 0) === 0).map((c) => c.id)
  const kept = (clients ?? []).length - removable.length
  if (removable.length) {
    const { error: clientError } = await db.from("clients").delete().in("id", removable)
    if (clientError) throw new Error(`Could not delete seed clients: ${clientError.message}`)
  }

  const { data: people } = await db.from("profiles").select("id").eq("is_seed", true)
  for (const person of people ?? []) {
    const { error: userError } = await db.auth.admin.deleteUser(person.id)
    if (userError) console.warn(`  Could not remove a seed login: ${userError.message}`)
  }

  // Let real order numbers continue from the highest number still in use.
  let counterNote = ""
  if (process.env.DATABASE_URL) {
    const pg = await connectDatabase()
    try {
      await pg.query(`
        update private.order_counters c
        set last_value = coalesce((
          select max(substring(o.order_number from '[0-9]+$')::integer)
          from public.orders o where o.order_number like 'RF-' || c.year || '-%'
        ), 0)`)
      counterNote = " Order numbering now continues from the highest real order."
    } finally {
      await pg.end()
    }
  } else {
    counterNote = " (Set DATABASE_URL to also reset order numbering.)"
  }

  console.log(
    `✓ Removed ${orders?.length ?? 0} seed orders, ${removable.length} seed clients, ${people?.length ?? 0} seed staff logins and ${photos} photos.` +
      (kept ? ` Kept ${kept} seed client(s) that now have real orders.` : "") +
      counterNote
  )
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
