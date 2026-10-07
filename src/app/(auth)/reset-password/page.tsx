import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"
import { FormAlert } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Choose a new password" }

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-[2rem] leading-tight font-bold text-ink sm:text-h1">Choose a new password</h1>
      <p className="mt-2 mb-8 text-sm text-stone">You&apos;ll use it the next time you sign in.</p>
      <Suspense fallback={<Skeleton className="h-56" />}>
        <ResetGate />
      </Suspense>
    </div>
  )
}

async function ResetGate() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert>This reset link has expired or was already used.</FormAlert>
        <Link href="/forgot-password" className="text-sm font-semibold text-regal underline-offset-4 hover:underline">
          Send me a new link
        </Link>
      </div>
    )
  }
  return <ResetPasswordForm />
}
