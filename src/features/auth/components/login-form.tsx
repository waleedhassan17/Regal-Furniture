"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/features/auth/actions"
import { signInSchema, type SignInInput } from "@/features/auth/schema"

const NOTICES: Record<string, { tone: "error" | "info" | "success"; text: string }> = {
  inactive: { tone: "error", text: "Your account has been deactivated. Ask an admin at Regal if you need access again." },
  "signed-out": { tone: "info", text: "You've been signed out." },
  link: { tone: "error", text: "That link has expired or was already used. Request a new one below." },
  "password-updated": { tone: "success", text: "Your password has been updated. Sign in with your new password." },
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const notice = NOTICES[searchParams.get("reason") ?? ""]
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next: searchParams.get("next") ?? undefined },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(values)
      if (!result.ok) {
        setServerError(result.error)
        form.setFocus("password")
        return
      }
      // Full navigation so every part of the app picks up the new session.
      window.location.replace(result.data.next)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? <FormAlert>{serverError}</FormAlert> : notice ? <FormAlert tone={notice.tone}>{notice.text}</FormAlert> : null}

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
  )
}
