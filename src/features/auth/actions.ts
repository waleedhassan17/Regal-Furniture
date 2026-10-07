"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { publicEnv } from "@/lib/env"
import type { ActionResult } from "@/lib/actions"
import { ROLE_TITLE, type SignInRole } from "@/features/auth/roles"
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

export type SignInResult =
  | { ok: true; data: { next: string } }
  | { ok: false; error: string; actualRole?: SignInRole }

export async function signIn(raw: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: "Enter your email and password." }
  const { email, password, role, next } = parsed.data

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

  // A valid login is not enough: the account needs an active profile with the chosen role.
  const { data: profile } = await supabase.from("profiles").select("is_active, role").eq("id", data.user.id).maybeSingle()
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return { ok: false, error: "Your account isn't active. Ask an admin at Regal to give you access." }
  }
  if (profile.role !== role) {
    await supabase.auth.signOut()
    return {
      ok: false,
      error: `This is ${profile.role === "admin" ? "an office & admin" : "a factory staff"} account. Choose “${ROLE_TITLE[profile.role]}” to sign in.`,
      actualRole: profile.role,
    }
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
