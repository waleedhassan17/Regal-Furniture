import "server-only"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { publicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

/** Supabase client acting as the signed-in user (RLS applies). Use in Server Components and Actions. */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes sessions.
        }
      },
    },
  })
}
