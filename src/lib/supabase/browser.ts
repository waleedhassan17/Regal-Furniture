"use client"

import { createBrowserClient } from "@supabase/ssr"
import { publicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/** Browser Supabase client (signed-in user's session; RLS applies). Used for direct photo uploads. */
export function createClient() {
  client ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
  return client
}
