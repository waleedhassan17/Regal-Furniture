"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { updateCompanyAction } from "@/features/company/actions"
import { companySchema, type CompanyFormValues, type CompanyValues } from "@/features/company/schema"

/** Company profile used on job sheets and across the portal (admins only). */
export function CompanyForm({ initial }: { initial: CompanyFormValues }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<CompanyFormValues, unknown, CompanyValues>({ resolver: zodResolver(companySchema), defaultValues: initial })
  const { errors, isDirty } = form.formState

  const submit = form.handleSubmit(() => {
    setServerError(null)
    const raw = form.getValues()
    startTransition(async () => {
      const result = await updateCompanyAction(raw)
      if (!result.ok) return setServerError(result.error)
      toast.success(result.message ?? "Saved")
      form.reset(raw)
    })
  })

  const text = (name: keyof CompanyFormValues) => ({
    id: `co-${name}`,
    "aria-invalid": !!errors[name],
    "aria-describedby": describedBy(`co-${name}`, { error: errors[name] }),
    ...form.register(name),
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-xl border border-line bg-card p-5 sm:p-6">
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Company name" htmlFor="co-company_name" error={errors.company_name?.message}>
          <Input autoComplete="organization" {...text("company_name")} />
        </Field>
        <Field label="Business phone" htmlFor="co-company_phone" error={errors.company_phone?.message} optional>
          <Input type="tel" inputMode="tel" {...text("company_phone")} />
        </Field>
        <Field label="Company email" htmlFor="co-company_email" error={errors.company_email?.message} optional>
          <Input type="email" inputMode="email" autoCapitalize="none" {...text("company_email")} />
        </Field>
        <Field label="Website" htmlFor="co-company_website" error={errors.company_website?.message} optional>
          <Input inputMode="url" autoCapitalize="none" {...text("company_website")} />
        </Field>
        <Field label="Address" htmlFor="co-company_address" error={errors.company_address?.message} optional>
          <Input {...text("company_address")} />
        </Field>
        <Field label="City" htmlFor="co-company_city" error={errors.company_city?.message} optional>
          <Input {...text("company_city")} />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-3">
        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={pending}>
            Undo changes
          </Button>
        )}
        <Button type="submit" disabled={pending || !isDirty}>
          {pending && <Spinner />} Save company details
        </Button>
      </div>
    </form>
  )
}
