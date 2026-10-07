import "server-only"
import { createClient } from "@/lib/supabase/server"

export type ReminderSettings = {
  dueSoonDays: number
  startWarningDays: number
  notStartedGraceDays: number
  updatedAt: string | null
}

export const DEFAULT_SETTINGS: ReminderSettings = { dueSoonDays: 3, startWarningDays: 10, notStartedGraceDays: 2, updatedAt: null }

export async function getSettings(): Promise<ReminderSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("settings")
    .select("due_soon_days, start_warning_days, not_started_grace_days, updated_at, updated_by")
    .eq("id", 1)
    .maybeSingle()
  if (error) throw new Error(`getSettings: ${error.message}`)
  if (!data) return DEFAULT_SETTINGS
  return {
    dueSoonDays: data.due_soon_days,
    startWarningDays: data.start_warning_days,
    notStartedGraceDays: data.not_started_grace_days,
    // Only meaningful once an admin has saved; before that it is the install time.
    updatedAt: data.updated_by ? data.updated_at : null,
  }
}
