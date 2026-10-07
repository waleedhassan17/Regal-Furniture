import "server-only"
import { cache } from "react"
import { forbidden, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Enums } from "@/types/database"

export type UserRole = Enums<"user_role">

export type CurrentUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  isAdmin: boolean
}

type SessionState =
  | { status: "signed-out" }
  | { status: "no-access" } // signed in, but no profile or deactivated
  | { status: "active"; user: CurrentUser }

/**
 * Reads the verified session and the caller's profile once per request.
 * The profile read goes through RLS, which only returns rows to active users,
 * so a missing row means "no profile" or "deactivated" — both mean no access.
 */
const loadSession = cache(async (): Promise<SessionState> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return { status: "signed-out" }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", claims.sub)
    .maybeSingle()

  if (error) {
    console.error("[auth] profile lookup failed", error.message)
    throw new Error("We couldn't load your account. Please try again.")
  }
  if (!profile || !profile.is_active) return { status: "no-access" }

  return {
    status: "active",
    user: {
      id: profile.id,
      email: typeof claims.email === "string" ? claims.email : "",
      fullName: profile.full_name,
      role: profile.role,
      isAdmin: profile.role === "admin",
    },
  }
})

/** The signed-in, active user, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await loadSession()
  return session.status === "active" ? session.user : null
}

/** For pages: the active user, or a redirect to sign in (deactivated users are signed out). */
export async function requireUser(): Promise<CurrentUser> {
  const session = await loadSession()
  if (session.status === "signed-out") redirect("/login")
  if (session.status === "no-access") redirect("/auth/signout?reason=inactive")
  return session.user
}

/** For admin-only pages: renders the 403 page for staff. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (!user.isAdmin) forbidden()
  return user
}
