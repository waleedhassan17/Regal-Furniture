"use server"

import { refresh, revalidatePath } from "next/cache"
import { createAction, friendlyDbError } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { settingsSchema } from "@/features/settings/schema"

export const updateSettingsAction = createAction({ schema: settingsSchema, guard: "admin", name: "settings.update" }, async (values, user) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("settings")
    .update({ ...values, updated_by: user.id })
    .eq("id", 1)
    .select("id")
    .maybeSingle()
  if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save the settings. Please try again.") }
  if (!data) return { ok: false, error: "Settings could not be found. Please contact support." }
  refresh()
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  revalidatePath("/orders")
  return { ok: true, data: undefined, message: "Reminder settings saved — the dashboard uses them straight away" }
})
