import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm, type LoginNotice } from "@/features/auth/components/login-form"
import { RoleChooser } from "@/features/auth/components/role-chooser"
import { parseSignInRole } from "@/features/auth/roles"
import { FormAlert } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Sign in" }

const NOTICES: Record<string, LoginNotice> = {
  inactive: { tone: "error", text: "Your account has been deactivated. Ask an admin at Regal if you need access again." },
  "signed-out": { tone: "info", text: "You've been signed out." },
  link: { tone: "error", text: "That link has expired or was already used. Request a new one from “Forgot your password?”." },
  "password-updated": { tone: "success", text: "Your password has been updated. Sign in with your new password." },
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <Login searchParams={props.searchParams} />
    </Suspense>
  )
}

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  const role = parseSignInRole(first(params.role))
  const next = first(params.next) ?? null
  const notice = NOTICES[first(params.reason) ?? ""]

  if (role) return <LoginForm role={role} next={next} notice={notice} />

  // Step one: choose how you're signing in.
  return (
    <div>
      <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">Sign in to Regal Orders</h1>
      <p className="mt-2 mb-8 text-sm text-stone">First, choose how you&apos;re signing in.</p>
      {notice && (
        <div className="mb-5">
          <FormAlert tone={notice.tone}>{notice.text}</FormAlert>
        </div>
      )}
      <RoleChooser layout="stack" next={next} />
      <p className="mt-6 text-caption leading-relaxed text-stone">
        Your role is set on your account by the office. If you don&apos;t have an account yet, ask an admin at Regal.
      </p>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-4 h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
