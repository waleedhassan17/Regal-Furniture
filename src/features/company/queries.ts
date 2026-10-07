import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export type Company = Pick<Tables<"company">, "name" | "phone" | "email" | "address" | "city" | "website">

/** The company profile (any active user can read it). Null on installs that haven't added one yet. */
export const getCompany = cache(async (): Promise<Company | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("company").select("name, phone, email, address, city, website").eq("id", 1).maybeSingle()
  if (error) throw new Error(`getCompany: ${error.message}`)
  return data
})

/** Whether the one-time company registration is still available. */
export async function isRegistrationOpen(): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("registration_open")
  if (error) {
    console.error("[company] registration_open failed", error.message)
    return false
  }
  return data === true
}
