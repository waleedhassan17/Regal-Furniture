import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isRegistrationOpen } from "@/features/company/queries"
import { RegisterForm } from "@/features/registration/components/register-form"

export const metadata: Metadata = { title: "Register your company" }

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <Register />
    </Suspense>
  )
}

async function Register() {
  if (!(await isRegistrationOpen())) {
    return (
      <div>
        <span className="inline-flex size-12 items-center justify-center rounded-xl border border-line bg-subtle text-stone">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">Already registered</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Regal Furnitures is already set up on this portal. Staff accounts are created by the office admins — ask an admin
          at Regal if you need one.
        </p>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">Register your company</h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-stone">
        Set up the order portal for Regal Furnitures. This is done once, by the owner or office manager.
      </p>
      <RegisterForm requireCode={Boolean(process.env.REGISTRATION_CODE)} />
    </div>
  )
}

function RegisterSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="mt-6 h-64" />
      <Skeleton className="h-64" />
    </div>
  )
}
