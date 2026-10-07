import type { Enums } from "@/types/database"

export type SignInRole = Enums<"user_role">

/** The two ways into the portal. The account's real role is always checked at sign-in. */
export const SIGN_IN_ROLES: ReadonlyArray<{ value: SignInRole; title: string; description: string }> = [
  {
    value: "admin",
    title: "Office & admin",
    description: "Enter orders, manage clients and payments, and run the team.",
  },
  {
    value: "staff",
    title: "Factory staff",
    description: "See what needs making, update progress and add notes from your phone.",
  },
]

export const ROLE_TITLE: Record<SignInRole, string> = {
  admin: "Office & admin",
  staff: "Factory staff",
}

export function parseSignInRole(value: unknown): SignInRole | null {
  return value === "admin" || value === "staff" ? value : null
}

/** /login link for a role, keeping where the person was trying to go. */
export function loginHref(role: SignInRole | null, next?: string | null): string {
  const params = new URLSearchParams()
  if (role) params.set("role", role)
  if (next) params.set("next", next)
  const query = params.toString()
  return query ? `/login?${query}` : "/login"
}
