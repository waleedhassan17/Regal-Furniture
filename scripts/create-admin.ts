/**
 * Creates the first admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (and optional
 * SEED_ADMIN_NAME). Safe to re-run: an existing account is promoted to an active admin
 * and its password is left unchanged. Values from .env.local are never printed.
 */
import { findUserByEmail, serviceClient } from "./lib/supabase"

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim()
  const password = process.env.SEED_ADMIN_PASSWORD
  const fullName = process.env.SEED_ADMIN_NAME?.trim() || "Regal Admin"
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local, then run this again.")
  }
  if (password.length < 8) throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.")

  const admin = serviceClient()
  let user = await findUserByEmail(admin, email)
  let created = false
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error || !data.user) throw new Error(`Could not create the admin account: ${error?.message ?? "unknown error"}`)
    user = data.user
    created = true
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, role: "admin", is_active: true }, { onConflict: "id" })
  if (profileError) throw new Error(`Could not save the admin profile: ${profileError.message}`)

  console.log(
    created
      ? "✓ Admin account created for SEED_ADMIN_EMAIL with an active admin profile."
      : "✓ SEED_ADMIN_EMAIL already had an account; its profile is now an active admin (password unchanged)."
  )
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
