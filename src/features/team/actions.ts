"use server"

import { refresh, revalidatePath } from "next/cache"
import { createAction, friendlyDbError, type ActionResult } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { activeSchema, newMemberSchema, resetPasswordSchema, roleSchema } from "@/features/team/schema"

/** Long enough to mean "until reactivated". */
const BAN_FOREVER = "876000h"

function revalidateTeam() {
  refresh()
  revalidatePath("/team")
}

export const createMemberAction = createAction(
  { schema: newMemberSchema, guard: "admin", name: "team.create" },
  async ({ full_name, email, phone, role, password }): Promise<ActionResult<{ id: string }>> => {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })
    if (error || !data.user) {
      if (error?.code === "email_exists" || /already been registered/i.test(error?.message ?? "")) {
        return { ok: false, error: "Someone with this email already has an account.", fieldErrors: { email: ["This email is already in use."] } }
      }
      if (error?.code === "weak_password") return { ok: false, error: "That password is too easy to guess. Try a longer one.", fieldErrors: { password: ["Too easy to guess."] } }
      console.error("[team.create] createUser failed", error?.code, error?.status)
      return { ok: false, error: "We couldn't create this account. Please try again." }
    }

    // Insert the profile as the signed-in admin so RLS applies; roll back the login if it fails.
    const supabase = await createClient()
    const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, full_name, phone, role, is_active: true })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { ok: false, error: friendlyDbError(profileError, "We couldn't create this account. Please try again.") }
    }
    revalidateTeam()
    revalidatePath("/orders")
    return { ok: true, data: { id: data.user.id }, message: `${full_name} can now sign in` }
  }
)

export const changeRoleAction = createAction({ schema: roleSchema, guard: "admin", name: "team.role" }, async ({ userId, role }, me) => {
  if (userId === me.id && role !== "admin") {
    return { ok: false, error: "You can't remove your own admin access. Ask another admin to do it." }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("full_name").maybeSingle()
  if (error) return { ok: false, error: friendlyDbError(error) }
  if (!data) return { ok: false, error: "This person no longer exists." }
  revalidateTeam()
  return { ok: true, data: undefined, message: `${data.full_name} is now ${role === "admin" ? "an admin" : "staff"}` }
})

export const setActiveAction = createAction({ schema: activeSchema, guard: "admin", name: "team.active" }, async ({ userId, active }, me) => {
  if (userId === me.id && !active) return { ok: false, error: "You can't deactivate your own account." }
  const supabase = await createClient()
  // The profile flag takes effect at once: every page and every database query checks it.
  const { data, error } = await supabase.from("profiles").update({ is_active: active }).eq("id", userId).select("full_name").maybeSingle()
  if (error) return { ok: false, error: friendlyDbError(error) }
  if (!data) return { ok: false, error: "This person no longer exists." }

  // Also block new sign-ins and token refreshes at the auth layer.
  const { error: banError } = await createAdminClient().auth.admin.updateUserById(userId, { ban_duration: active ? "none" : BAN_FOREVER })
  if (banError) console.error("[team.active] auth ban update failed", banError.code, banError.status)

  revalidateTeam()
  return { ok: true, data: undefined, message: active ? `${data.full_name} can sign in again` : `${data.full_name} has been deactivated` }
})

export const resetMemberPasswordAction = createAction(
  { schema: resetPasswordSchema, guard: "admin", name: "team.password" },
  async ({ userId, password }) => {
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password })
    if (error) {
      if (error.code === "weak_password") return { ok: false, error: "That password is too easy to guess. Try a longer one." }
      console.error("[team.password] update failed", error.code, error.status)
      return { ok: false, error: "We couldn't set the password. Please try again." }
    }
    return { ok: true, data: undefined, message: "Temporary password set" }
  }
)
