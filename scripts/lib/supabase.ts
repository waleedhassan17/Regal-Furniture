import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../src/types/database"

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set in .env.local.`)
  return value
}

/** Service-role client for scripts (bypasses RLS). */
export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Anon-key client, as the browser would use it (RLS applies). */
export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Finds an auth user by email (paginates; the team is small). */
export async function findUserByEmail(admin: SupabaseClient<Database>, email: string) {
  const target = email.trim().toLowerCase()
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`Could not list users: ${error.message}`)
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) return match
    if (data.users.length < 200) return null
  }
  return null
}
