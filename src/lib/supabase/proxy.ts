import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { publicEnv } from "@/lib/env"
import type { Database } from "@/types/database"

/** Paths reachable without a session. */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/auth/"]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p))
}

/**
 * Refreshes the Supabase session cookie and redirects anonymous visitors to /login.
 * This is an optimistic check only: every page and server action re-verifies the user
 * and their active profile through `src/lib/auth/session.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
      },
    },
  })

  // Must run before any redirect decision: it refreshes an expired access token.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims?.sub)
  const { pathname, search } = request.nextUrl

  // Password-reset links can land on the site root with a ?code= when the redirect URL
  // is not on Supabase's allow list; route them through the callback.
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/callback"
    if (!url.searchParams.has("next")) url.searchParams.set("next", "/reset-password")
    return redirectWithCookies(url, response)
  }

  if (!signedIn && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    if (pathname !== "/" && pathname !== "/dashboard") url.searchParams.set("next", pathname + search)
    return redirectWithCookies(url, response)
  }

  if (signedIn && (pathname === "/login" || pathname === "/forgot-password")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  return response
}

/** Redirect while keeping any refreshed auth cookies. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}
