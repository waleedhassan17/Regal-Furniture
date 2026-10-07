"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { updatePassword } from "@/features/auth/actions"
import { PASSWORD_MIN, newPasswordSchema, type NewPasswordInput } from "@/features/auth/schema"

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await updatePassword(values)
      if (!result.ok) return setServerError(result.error)
      window.location.replace("/dashboard")
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <Field label="New password" htmlFor="password" error={errors.password?.message} hint={`At least ${PASSWORD_MIN} characters.`}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", { error: errors.password, hint: true })}
          {...form.register("password")}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          aria-describedby={describedBy("confirm", { error: errors.confirm })}
          {...form.register("confirm")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Spinner />}
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  )
}
