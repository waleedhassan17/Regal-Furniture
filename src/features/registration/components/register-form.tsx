"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { registerCompanyAction } from "@/features/registration/actions"
import { registerSchema, type RegisterFormValues, type RegisterValues } from "@/features/registration/schema"
import { PASSWORD_MIN } from "@/lib/validation/fields"

type RegisterFormProps = {
  /** Shown when the server has a REGISTRATION_CODE configured. */
  requireCode: boolean
}

/** One-time company registration: company details and the owner's account. */
export function RegisterForm({ requireCode }: RegisterFormProps) {
  const [serverError, setServerError] = useState<{ message: string; closed?: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<RegisterFormValues, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: "Regal Furnitures",
      company_phone: "",
      company_email: "",
      company_city: "",
      company_address: "",
      company_website: "",
      owner_name: "",
      owner_phone: "",
      email: "",
      password: "",
      confirm: "",
      setup_code: "",
    },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit(() => {
    setServerError(null)
    const raw = form.getValues()
    startTransition(async () => {
      const result = await registerCompanyAction(raw)
      if (!result.ok) {
        setServerError({ message: result.error, closed: result.closed })
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (field in raw) form.setError(field as keyof RegisterFormValues, { message: messages[0] })
        }
        return
      }
      window.location.replace(result.signedIn ? "/dashboard?welcome=1" : "/login?role=admin&reason=registered")
    })
  })

  const text = (name: keyof RegisterFormValues, extra?: { hint?: boolean }) => ({
    id: `reg-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": describedBy(`reg-${name}`, { error: errors[name], hint: extra?.hint }),
    ...form.register(name),
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      {serverError && (
        <div className="flex flex-col gap-3">
          <FormAlert>{serverError.message}</FormAlert>
          {serverError.closed && (
            <Button asChild variant="outline">
              <Link href="/login">Go to sign in</Link>
            </Button>
          )}
        </div>
      )}

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 text-[1.0625rem] font-semibold tracking-tight text-ink">Company</legend>
        <Field label="Company name" htmlFor="reg-company_name" error={errors.company_name?.message}>
          <Input autoComplete="organization" {...text("company_name")} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Business phone" htmlFor="reg-company_phone" error={errors.company_phone?.message} optional>
            <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="042-3576 1900" {...text("company_phone")} />
          </Field>
          <Field label="City" htmlFor="reg-company_city" error={errors.company_city?.message} optional>
            <Input autoComplete="address-level2" placeholder="Lahore" {...text("company_city")} />
          </Field>
        </div>
        <Field label="Address" htmlFor="reg-company_address" error={errors.company_address?.message} optional>
          <Input autoComplete="street-address" {...text("company_address")} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Company email" htmlFor="reg-company_email" error={errors.company_email?.message} optional>
            <Input type="email" inputMode="email" autoCapitalize="none" placeholder="info@regalpk.com" {...text("company_email")} />
          </Field>
          <Field label="Website" htmlFor="reg-company_website" error={errors.company_website?.message} optional>
            <Input inputMode="url" autoCapitalize="none" placeholder="regalpk.com" {...text("company_website")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 border-t border-line pt-8">
        <legend className="sr-only">Your account</legend>
        <div>
          <h2 className="text-[1.0625rem] font-semibold tracking-tight text-ink">Your account</h2>
          <p className="mt-1 text-sm text-stone">You&apos;ll be the owner and the first admin. You can add your team afterwards.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="reg-owner_name" error={errors.owner_name?.message}>
            <Input autoComplete="name" {...text("owner_name")} />
          </Field>
          <Field label="Mobile number" htmlFor="reg-owner_phone" error={errors.owner_phone?.message} optional>
            <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0300-1234567" {...text("owner_phone")} />
          </Field>
        </div>
        <Field label="Work email" htmlFor="reg-email" error={errors.email?.message} hint="You'll sign in with this email.">
          <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} {...text("email", { hint: true })} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Password" htmlFor="reg-password" error={errors.password?.message} hint={`At least ${PASSWORD_MIN} characters.`}>
            <PasswordInput autoComplete="new-password" {...text("password", { hint: true })} />
          </Field>
          <Field label="Confirm password" htmlFor="reg-confirm" error={errors.confirm?.message}>
            <PasswordInput autoComplete="new-password" {...text("confirm")} />
          </Field>
        </div>
        {requireCode && (
          <Field label="Setup code" htmlFor="reg-setup_code" error={errors.setup_code?.message} hint="Provided with the portal. It stops anyone else registering first.">
            <Input autoComplete="off" spellCheck={false} {...text("setup_code", { hint: true })} />
          </Field>
        )}
      </fieldset>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending && <Spinner />}
          {pending ? "Setting up…" : "Register company"}
        </Button>
        <p className="text-center text-sm text-stone">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
