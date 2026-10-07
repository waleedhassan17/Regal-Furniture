import "server-only"
import { createClient } from "@supabase/supabase-js"
import { publicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

/**
 * Service-role client: bypasses RLS. Only for user management (creating, banning and
 * signing out accounts). Never import from client code; `server-only` enforces that.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY.")
  return createClient<Database>(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
