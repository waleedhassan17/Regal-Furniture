import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = { title: "Reset your password" }

export default function ForgotPasswordPage() {
  return (
    <div>
      <Link
        href="/login"
        className="mb-8 inline-flex h-11 items-center gap-2 rounded-md text-sm font-semibold text-stone hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
      <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">Forgot your password?</h1>
      <p className="mt-2 mb-8 text-sm text-stone">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <ForgotPasswordForm />
    </div>
  )
}
