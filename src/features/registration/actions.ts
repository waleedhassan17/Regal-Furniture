"use server"

import { timingSafeEqual } from "node:crypto"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { registerSchema, type RegisterFormValues } from "@/features/registration/schema"

export type RegisterResult =
  | { ok: true; signedIn: boolean }
  | { ok: false; error: string; closed?: boolean; fieldErrors?: Record<string, string[]> }

const CLOSED = "This portal has already been registered. Sign in instead, or ask an admin at Regal for an account."

function codeMatches(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * One-time company registration. Creates the owner's login, then — in one database
 * transaction — the owner's admin profile and the company profile. If anything fails
 * after the login is created, the login is removed again.
 */
export async function registerCompanyAction(raw: RegisterFormValues): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }
  const v = parsed.data

  const expectedCode = process.env.REGISTRATION_CODE
  if (expectedCode && !codeMatches(v.setup_code ?? "", expectedCode)) {
    return { ok: false, error: "That setup code isn't right.", fieldErrors: { setup_code: ["Check the setup code and try again."] } }
  }

  const admin = createAdminClient()
  const { data: open, error: openError } = await admin.rpc("registration_open")
  if (openError) {
    console.error("[register] registration_open failed", openError.message)
    return { ok: false, error: "We couldn't reach the server. Please try again in a moment." }
  }
  if (!open) return { ok: false, error: CLOSED, closed: true }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.owner_name },
  })
  if (createError || !created.user) {
    if (createError?.code === "email_exists" || /already been registered/i.test(createError?.message ?? "")) {
      return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: ["This email is already in use."] } }
    }
    if (createError?.code === "weak_password") {
      return { ok: false, error: "That password is too easy to guess.", fieldErrors: { password: ["Choose a longer, less common password."] } }
    }
    console.error("[register] createUser failed", createError?.code, createError?.status)
    return { ok: false, error: "We couldn't create your account. Please try again." }
  }

  const { error: registerError } = await admin.rpc("register_company", {
    p_owner_id: created.user.id,
    p_owner_name: v.owner_name,
    p_owner_phone: v.owner_phone ?? "",
    p_company_name: v.company_name,
    p_company_phone: v.company_phone ?? "",
    p_company_email: v.company_email ?? "",
    p_company_address: v.company_address ?? "",
    p_company_city: v.company_city ?? "",
    p_company_website: v.company_website ?? "",
  })
  if (registerError) {
    await admin.auth.admin.deleteUser(created.user.id)
    if (registerError.code === "P0001") return { ok: false, error: CLOSED, closed: true }
    console.error("[register] register_company failed", registerError.code, registerError.message)
    return { ok: false, error: "We couldn't finish setting up the company. Nothing was saved — please try again." }
  }

  // Sign the owner straight in.
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password })
  if (signInError) console.error("[register] sign-in after registration failed", signInError.code, signInError.status)
  return { ok: true, signedIn: !signInError }
}
