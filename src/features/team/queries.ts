import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/types/database"

export type TeamMember = Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "role" | "is_active" | "created_at"> & {
  email: string | null
  lastSignInAt: string | null
}

/** Admin only (the page calls requireAdmin). Emails live in Supabase Auth, read with the service role. */
export async function listTeam(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, is_active, created_at, is_seed")
    .order("is_active", { ascending: false })
    .order("role")
    .order("full_name")
  if (error) throw new Error(`listTeam: ${error.message}`)

  const admin = createAdminClient()
  const auth = new Map<string, { email: string | null; lastSignInAt: string | null }>()
  for (let page = 1; page < 20; page++) {
    const { data, error: authError } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (authError) throw new Error(`listTeam auth: ${authError.message}`)
    for (const u of data.users) auth.set(u.id, { email: u.email ?? null, lastSignInAt: u.last_sign_in_at ?? null })
    if (data.users.length < 200) break
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    role: p.role,
    is_active: p.is_active,
    created_at: p.created_at,
    email: auth.get(p.id)?.email ?? null,
    lastSignInAt: auth.get(p.id)?.lastSignInAt ?? null,
  }))
}
