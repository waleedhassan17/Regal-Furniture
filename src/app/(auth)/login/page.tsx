import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/features/auth/components/login-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div>
      <p className="eyebrow mb-3 text-regal">Welcome back</p>
      <h1 className="font-heading text-[2rem] leading-tight font-bold text-ink sm:text-h1">Sign in to Regal Orders</h1>
      <p className="mt-2 mb-8 text-sm text-stone">Use the email and password your admin gave you.</p>
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-[4.25rem]" />
      <Skeleton className="h-[4.25rem]" />
      <Skeleton className="h-12" />
    </div>
  )
}
