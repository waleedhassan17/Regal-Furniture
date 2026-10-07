import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function signOut(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const reason = request.nextUrl.searchParams.get("reason") === "inactive" ? "inactive" : "signed-out"
  // 303 so a POST from the sign-out form becomes a GET of the login page.
  return NextResponse.redirect(new URL(`/login?reason=${reason}`, request.nextUrl.origin), { status: 303 })
}

export const GET = signOut
export const POST = signOut
