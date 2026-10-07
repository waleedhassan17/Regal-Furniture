"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { clientSchema, emptyClient, type ClientFormValues, type ClientValues } from "@/features/clients/schema"
import type { ActionResult } from "@/lib/actions"

type ClientFormProps<T> = {
  defaultValues?: ClientFormValues
  submitLabel: string
  onSubmit: (values: ClientValues) => Promise<ActionResult<T>>
  onSuccess: (data: T, message?: string) => void
  onCancel?: () => void
  idPrefix?: string
}

/** Client details form, used for adding and editing clients (also inline from the order form). */
export function ClientForm<T>({ defaultValues = emptyClient, submitLabel, onSubmit, onSuccess, onCancel, idPrefix = "client" }: ClientFormProps<T>) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<ClientFormValues, unknown, ClientValues>({ resolver: zodResolver(clientSchema), defaultValues })
  const { errors } = form.formState
  const id = (name: string) => `${idPrefix}-${name}`

  const submit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await onSubmit(values)
      if (!result.ok) {
        setServerError(result.error)
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof ClientFormValues, { message: messages[0] })
        }
        return
      }
      onSuccess(result.data, result.message)
    })
  })

  const text = (name: keyof ClientFormValues) => ({
    id: id(name),
    "aria-invalid": !!errors[name],
    "aria-describedby": describedBy(id(name), { error: errors[name] }),
    ...form.register(name),
  })

  return (
    <form
      onSubmit={(e) => {
        // The client dialog can open from inside the order form; keep its submit from bubbling there.
        e.stopPropagation()
        void submit(e)
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <Field label="Client name" htmlFor={id("name")} error={errors.name?.message}>
        <Input autoComplete="off" placeholder="e.g. Hamza Sb" autoFocus {...text("name")} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Phone" htmlFor={id("phone")} error={errors.phone?.message} optional>
          <Input type="tel" inputMode="tel" autoComplete="off" placeholder="0300-1234567" {...text("phone")} />
        </Field>
        <Field label="Alternate phone" htmlFor={id("alt_phone")} error={errors.alt_phone?.message} optional>
          <Input type="tel" inputMode="tel" autoComplete="off" {...text("alt_phone")} />
        </Field>
        <Field label="Company" htmlFor={id("company")} error={errors.company?.message} optional>
          <Input autoComplete="off" placeholder="School, office or business" {...text("company")} />
        </Field>
        <Field label="City" htmlFor={id("city")} error={errors.city?.message} optional>
          <Input autoComplete="off" placeholder="Lahore" {...text("city")} />
        </Field>
      </div>
      <Field label="Delivery address" htmlFor={id("address")} error={errors.address?.message} optional>
        <Textarea rows={2} className="min-h-20" {...text("address")} />
      </Field>
      <Field label="Notes" htmlFor={id("notes")} error={errors.notes?.message} optional>
        <Textarea rows={2} className="min-h-20" placeholder="Anything useful to remember about this client" {...text("notes")} />
      </Field>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
