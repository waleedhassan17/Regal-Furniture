"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { publicEnv } from "@/lib/env"
import type { ActionResult } from "@/lib/actions"
import {
  forgotPasswordSchema,
  newPasswordSchema,
  safeNextPath,
  signInSchema,
  type ForgotPasswordInput,
  type NewPasswordInput,
  type SignInInput,
} from "@/features/auth/schema"

const GENERIC = "We couldn't sign you in right now. Please try again in a moment."

export async function signIn(raw: SignInInput): Promise<ActionResult<{ next: string }>> {
  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Enter your email and password." }
  const { email, password, next } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    if (error?.code === "invalid_credentials" || error?.status === 400) {
      return { ok: false, error: "That email and password don't match. Check them and try again." }
    }
    if (error?.status === 429) return { ok: false, error: "Too many attempts. Wait a minute, then try again." }
    console.error("[auth] sign-in failed", error?.code, error?.status)
    return { ok: false, error: GENERIC }
  }

  // A valid login is not enough: the account needs an active profile.
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle()
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return { ok: false, error: "Your account isn't active. Ask an admin at Regal to give you access." }
  }

  return { ok: true, data: { next: safeNextPath(next) } }
}

export async function requestPasswordReset(raw: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." }

  const origin = (await headers()).get("origin") ?? publicEnv.siteUrl
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  if (error) {
    if (error.status === 429) {
      return { ok: false, error: "Too many reset emails have been sent. Wait a few minutes, then try again." }
    }
    // Don't reveal whether the account exists; log the detail for us.
    console.error("[auth] reset email failed", error.code, error.status)
  }
  return { ok: true, data: undefined }
}

export async function updatePassword(raw: NewPasswordInput): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) {
    return { ok: false, error: "This reset link has expired. Request a new one from the sign-in page." }
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Choose a password you haven't used here before." }
    if (error.code === "weak_password") return { ok: false, error: "That password is too easy to guess. Try a longer one." }
    console.error("[auth] password update failed", error.code, error.status)
    return { ok: false, error: "We couldn't update your password. Please try again." }
  }
  return { ok: true, data: undefined }
}
