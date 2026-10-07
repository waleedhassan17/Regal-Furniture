"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { requestPasswordReset } from "@/features/auth/actions"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schema"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await requestPasswordReset(values)
      if (!result.ok) return setServerError(result.error)
      setSentTo(values.email.trim())
    })
  })

  if (sentTo) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--st-done-bg)] text-[var(--st-done-fg)]">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-ink">
          If <strong className="font-semibold">{sentTo}</strong> has an account, a reset link is on its way. It works once
          and expires after an hour. Check your spam folder if it doesn&apos;t arrive in a few minutes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert>{serverError}</FormAlert>}
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
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Spinner />}
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  )
}
