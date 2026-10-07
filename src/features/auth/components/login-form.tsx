"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/features/auth/actions"
import { signInSchema } from "@/features/auth/schema"
import { ROLE_TITLE, loginHref, type SignInRole } from "@/features/auth/roles"
import { z } from "zod"

const credentialsSchema = signInSchema.pick({ email: true, password: true })
type Credentials = z.input<typeof credentialsSchema>

export type LoginNotice = { tone: "error" | "info" | "success"; text: string }

type LoginFormProps = {
  role: SignInRole
  next: string | null
  notice?: LoginNotice
}

const SUBTITLE: Record<SignInRole, string> = {
  admin: "Use your office email and password.",
  staff: "Use the email and password the office gave you.",
}

/** Step two of signing in: credentials for the chosen role. The server checks the role matches the account. */
export function LoginForm({ role: initialRole, next, notice }: LoginFormProps) {
  const [role, setRole] = useState<SignInRole>(initialRole)
  const [serverError, setServerError] = useState<{ message: string; actualRole?: SignInRole } | null>(null)
  const [pending, startTransition] = useTransition()

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  })
  const { errors } = form.formState

  function submitAs(asRole: SignInRole) {
    void form.handleSubmit((values) => {
      setServerError(null)
      startTransition(async () => {
        const result = await signIn({ ...values, role: asRole, next: next ?? undefined })
        if (!result.ok) {
          setServerError({ message: result.error, actualRole: result.actualRole })
          if (!result.actualRole) form.setFocus("password")
          return
        }
        // Full navigation so every part of the app picks up the new session.
        window.location.replace(result.data.next)
      })
    })()
  }

  function switchTo(nextRole: SignInRole) {
    setRole(nextRole)
    window.history.replaceState(null, "", loginHref(nextRole, next))
    submitAs(nextRole)
  }

  return (
    <div>
      <p className="eyebrow mb-3 text-regal">{ROLE_TITLE[role]}</p>
      <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">Sign in</h1>
      <p className="mt-2 text-sm text-stone">{SUBTITLE[role]}</p>
      <p className="mt-4 mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-strong bg-paper px-3 py-1 font-medium text-ink">
          Signing in as {ROLE_TITLE[role]}
        </span>
        <Link href={loginHref(null, next)} className="font-semibold text-stone underline-offset-4 hover:text-ink hover:underline">
          Change
        </Link>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitAs(role)
        }}
        noValidate
        className="flex flex-col gap-5"
      >
        {serverError ? (
          <div className="flex flex-col gap-3">
            <FormAlert>{serverError.message}</FormAlert>
            {serverError.actualRole && (
              <Button type="button" variant="outline" disabled={pending} onClick={() => switchTo(serverError.actualRole as SignInRole)}>
                <ArrowLeftRight aria-hidden="true" /> Continue as {ROLE_TITLE[serverError.actualRole]}
              </Button>
            )}
          </div>
        ) : notice ? (
          <FormAlert tone={notice.tone}>{notice.text}</FormAlert>
        ) : null}

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email", { error: errors.email })}
            {...form.register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={describedBy("password", { error: errors.password })}
            {...form.register("password")}
          />
        </Field>

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending && <Spinner />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-stone">
          <Link href="/forgot-password" className="font-semibold text-ink underline-offset-4 hover:text-regal hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </div>
  )
}
