import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/features/auth/schema"

/**
 * Landing point for links in auth emails (password reset). Supports both the default
 * PKCE `?code=` links and `?token_hash=&type=` links from customised email templates.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNextPath(searchParams.get("next") ?? "/reset-password")
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  const supabase = await createClient()
  let ok = false
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
    if (error) console.error("[auth] code exchange failed", error.code, error.status)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    ok = !error
    if (error) console.error("[auth] otp verify failed", error.code, error.status)
  }

  return NextResponse.redirect(new URL(ok ? next : "/login?reason=link", origin))
}
