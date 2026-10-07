"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormProvider, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CloudUpload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { uuidv4 } from "@/lib/uuid"
import { addDays, daysBetween, formatDate } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"
import { formatMoney } from "@/lib/format/money"
import { computeOrderMoney } from "@/lib/domain/money"
import { emptyItem, orderFormSchema, type OrderFormValues, type OrderValues } from "@/features/orders/schema"
import { saveOrderAction } from "@/features/orders/actions"
import { discardUpload } from "@/features/orders/upload"
import { ClientPicker } from "@/features/orders/components/client-picker"
import { ItemCard } from "@/features/orders/components/item-card"
import type { ClientOption } from "@/features/clients/queries"
import type { TeamMemberOption } from "@/features/orders/queries"

export type OrderFormInitial = {
  values: OrderFormValues
  client: ClientOption | null
  /** Signed URLs for photos already saved, by storage path. */
  imageUrls: Record<string, string>
  /** Total already received (edit mode), for the live balance. */
  received: number
}

type OrderFormProps = {
  mode: "create" | "edit"
  initial: OrderFormInitial
  team: TeamMemberOption[]
  today: string
  cancelHref: string
}

function blankValues(today: string): OrderFormValues {
  return {
    id: uuidv4(),
    client_id: "",
    bill_number: "",
    delivery_address: "",
    order_date: today,
    delivery_deadline: "",
    responsible_id: "",
    special_instructions: "",
    items: [emptyItem(uuidv4())],
    finance: { order_amount: "", delivery_charges: "" },
  }
}

function parseRupees(value: string | undefined | null): number | null {
  const digits = (value ?? "").replace(/[^\d]/g, "")
  return digits === "" ? null : Number(digits)
}

export function OrderForm({ mode, initial, team, today, cancelHref }: OrderFormProps) {
  const router = useRouter()
  const form = useForm<OrderFormValues, unknown, OrderValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initial.values,
    mode: "onTouched",
  })
  const { fields, append, insert, remove, move } = useFieldArray({ control: form.control, name: "items", keyName: "fieldKey" })
  const [client, setClient] = useState<ClientOption | null>(initial.client)
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState<Set<string>>(new Set())
  const [savedPaths, setSavedPaths] = useState(() => new Set(Object.keys(initial.imageUrls)))
  const alertRef = useRef<HTMLDivElement>(null)

  const { isDirty, errors } = form.formState
  const unsaved = useUnsavedChanges(isDirty && !pending)

  const orderId = useWatch({ control: form.control, name: "id" })
  const orderDate = useWatch({ control: form.control, name: "order_date" })
  const deadline = useWatch({ control: form.control, name: "delivery_deadline" })
  const items = useWatch({ control: form.control, name: "items" })
  const finance = useWatch({ control: form.control, name: "finance" })

  const money = computeOrderMoney({
    orderAmount: parseRupees(finance?.order_amount),
    deliveryCharges: parseRupees(finance?.delivery_charges),
    payments: initial.received ? [{ amount: initial.received }] : [],
  })
  const totalQuantity = (items ?? []).reduce((sum, i) => sum + (Number(i?.quantity) || 0), 0)
  const daysUntilDeadline = deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? daysBetween(today, deadline) : null

  const isSavedPath = useCallback((path: string) => savedPaths.has(path), [savedPaths])
  const setItemBusy = useCallback((itemId: string, busy: boolean) => {
    setUploading((prev) => {
      if (busy === prev.has(itemId)) return prev
      const next = new Set(prev)
      if (busy) next.add(itemId)
      else next.delete(itemId)
      return next
    })
  }, [])

  function selectClient(next: ClientOption) {
    const currentAddress = form.getValues("delivery_address") ?? ""
    const previousAddress = client?.address ?? ""
    setClient(next)
    form.setValue("client_id", next.id, { shouldDirty: true, shouldValidate: true })
    if (!currentAddress.trim() || currentAddress === previousAddress) {
      form.setValue("delivery_address", next.address ?? "", { shouldDirty: true })
    }
  }

  function addItem() {
    append(emptyItem(uuidv4()), { shouldFocus: false })
    requestAnimationFrame(() => {
      const nextIndex = form.getValues("items").length - 1
      form.setFocus(`items.${nextIndex}.name`)
    })
  }

  function duplicateItem(index: number) {
    const source = form.getValues(`items.${index}`)
    insert(index + 1, { ...source, id: uuidv4(), image_path: null }, { shouldFocus: false })
    toast("Item duplicated", { description: source.image_path ? "The photo wasn't copied — add one if needed." : undefined })
  }

  function removeItem(index: number) {
    const removed = form.getValues(`items.${index}`)
    remove(index)
    toast("Item removed", {
      description: removed.name || `Item ${index + 1}`,
      action: { label: "Undo", onClick: () => insert(index, removed, { shouldFocus: false }) },
      onAutoClose: () => {
        if (removed.image_path && !savedPaths.has(removed.image_path)) void discardUpload(removed.image_path)
      },
    })
  }

  function focusFirstError(fieldErrors: FieldErrors<OrderFormValues>) {
    setServerError("Some details need your attention. They're highlighted below.")
    const order: (keyof OrderFormValues)[] = ["client_id", "order_date", "delivery_deadline", "responsible_id", "items", "finance"]
    for (const key of order) {
      if (!fieldErrors[key]) continue
      if (key === "client_id") return document.getElementById("order-client")?.focus()
      if (key === "items") {
        const itemErrors = fieldErrors.items
        const index = Array.isArray(itemErrors) ? itemErrors.findIndex(Boolean) : -1
        if (index >= 0) return form.setFocus(`items.${index}.name`)
        return
      }
      if (key === "finance") return form.setFocus("finance.order_amount")
      return form.setFocus(key)
    }
  }

  function save() {
    if (uploading.size > 0) {
      setServerError("Wait for the photos to finish uploading, then save.")
      return
    }
    setServerError(null)
    const raw = form.getValues()
    startTransition(async () => {
      const result = await saveOrderAction(raw)
      if (!result.ok) {
        setServerError(result.error)
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (field in raw) form.setError(field as keyof OrderFormValues, { message: messages[0] })
        }
        alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
      toast.success(result.data.created ? `Order ${result.data.orderNumber} created` : `Order ${result.data.orderNumber} saved`)
      if (mode === "create") {
        // The page stays mounted in the background; start it fresh for the next order.
        const fresh = blankValues(today)
        form.reset(fresh)
        setClient(null)
      } else {
        form.reset(raw)
        setSavedPaths(new Set(raw.items.map((i) => i.image_path).filter((p): p is string => !!p)))
      }
      router.push(`/orders/${result.data.id}`)
    })
  }

  const saveLabel = mode === "create" ? "Create order" : "Save changes"
  const saveDisabled = pending || uploading.size > 0

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void form.handleSubmit(save, focusFirstError)(e)} noValidate className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:pb-0 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div ref={alertRef}>{serverError && <FormAlert>{serverError}</FormAlert>}</div>

          {/* Client */}
          <Section title="Client" description="Search by name, company or phone, or add a new client.">
            <Field label="Client" htmlFor="order-client" error={errors.client_id?.message}>
              <ClientPicker
                id="order-client"
                value={client}
                onChange={selectClient}
                invalid={!!errors.client_id}
                describedBy={describedBy("order-client", { error: errors.client_id })}
              />
            </Field>
            <Field
              label="Delivery address"
              htmlFor="delivery_address"
              error={errors.delivery_address?.message}
              hint="Filled from the client. Change it if this order goes somewhere else."
              optional
            >
              <Textarea
                id="delivery_address"
                rows={2}
                className="min-h-20"
                aria-describedby={describedBy("delivery_address", { error: errors.delivery_address, hint: true })}
                {...form.register("delivery_address")}
              />
            </Field>
          </Section>

          {/* Order details */}
          <Section title="Order details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Order date" htmlFor="order_date" error={errors.order_date?.message}>
                <Input id="order_date" type="date" max={today} aria-invalid={!!errors.order_date} {...form.register("order_date")} />
              </Field>
              <Field
                label="Delivery deadline"
                htmlFor="delivery_deadline"
                error={errors.delivery_deadline?.message}
                hint={daysUntilDeadline !== null ? `${formatDate(deadline)} · ${formatDaysLeft(daysUntilDeadline)}` : "The date promised to the client."}
              >
                <Input
                  id="delivery_deadline"
                  type="date"
                  min={orderDate || undefined}
                  aria-invalid={!!errors.delivery_deadline}
                  aria-describedby={describedBy("delivery_deadline", { error: errors.delivery_deadline, hint: true })}
                  {...form.register("delivery_deadline")}
                />
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick deadline">
                  {[
                    { label: "+1 week", days: 7 },
                    { label: "+2 weeks", days: 14 },
                    { label: "+1 month", days: 30 },
                  ].map((option) => (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() =>
                        form.setValue("delivery_deadline", addDays(orderDate || today, option.days), { shouldDirty: true, shouldValidate: true })
                      }
                      className="inline-flex h-9 items-center rounded-full border border-line-strong bg-paper px-3 text-caption font-semibold text-ink hover:bg-subtle"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Bill number" htmlFor="bill_number" error={errors.bill_number?.message} optional>
                <Input id="bill_number" autoComplete="off" placeholder="From the bill book" {...form.register("bill_number")} />
              </Field>
              <Field label="Person responsible" htmlFor="responsible_id" error={errors.responsible_id?.message} optional>
                <NativeSelect id="responsible_id" aria-invalid={!!errors.responsible_id} {...form.register("responsible_id")}>
                  <option value="">Not assigned yet</option>
                  {team.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field
              label="Special instructions"
              htmlFor="special_instructions"
              error={errors.special_instructions?.message}
              hint="Printed on the factory job sheet."
              optional
            >
              <Textarea id="special_instructions" rows={3} {...form.register("special_instructions")} />
            </Field>
          </Section>

          {/* Items */}
          <section aria-labelledby="items-heading" className="flex flex-col gap-4">
            <SectionHeading
              id="items-heading"
              title="Items"
              description={`${fields.length} ${fields.length === 1 ? "item" : "items"} · ${totalQuantity} ${totalQuantity === 1 ? "piece" : "pieces"} in total`}
            />
            {typeof errors.items?.message === "string" && <FormAlert>{errors.items.message}</FormAlert>}
            <div className="flex flex-col gap-4">
              {fields.map((field, index) => (
                <ItemCard
                  key={field.fieldKey}
                  index={index}
                  count={fields.length}
                  orderId={orderId}
                  savedUrl={items?.[index]?.image_path ? (initial.imageUrls[items[index].image_path ?? ""] ?? null) : null}
                  isSavedPath={isSavedPath}
                  onDuplicate={() => duplicateItem(index)}
                  onRemove={() => removeItem(index)}
                  onMove={(direction) => {
                    const target = index + direction
                    if (target >= 0 && target < fields.length) move(index, target)
                  }}
                  onBusyChange={setItemBusy}
                />
              ))}
            </div>
            <Button type="button" variant="outline" size="lg" onClick={addItem} className="w-full border-dashed">
              <Plus aria-hidden="true" /> Add another item
            </Button>
          </section>

          {/* Amounts (admin only — this form is only shown to admins) */}
          <Section title="Amounts" description="Only admins see amounts. Leave blank if the price isn't agreed yet.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Order amount" htmlFor="order_amount" error={errors.finance?.order_amount?.message} optional>
                <RupeeInput id="order_amount" invalid={!!errors.finance?.order_amount} {...form.register("finance.order_amount")} />
              </Field>
              <Field label="Delivery charges" htmlFor="delivery_charges" error={errors.finance?.delivery_charges?.message} optional>
                <RupeeInput id="delivery_charges" invalid={!!errors.finance?.delivery_charges} {...form.register("finance.delivery_charges")} />
              </Field>
            </div>
            <dl className="grid gap-2 rounded-lg bg-subtle/70 p-4 text-sm tabular">
              <Row label="Grand total" value={money.grandTotal === null ? "Not set" : formatMoney(money.grandTotal)} strong />
              {mode === "edit" && (
                <>
                  <Row label="Received so far" value={formatMoney(money.received)} />
                  <Row
                    label={money.overpaid > 0 ? "Overpaid" : "Remaining"}
                    value={money.remaining === null ? "—" : formatMoney(Math.abs(money.remaining))}
                    strong
                  />
                </>
              )}
            </dl>
          </Section>
        </div>

        {/* Summary + save (sticky on desktop) */}
        <aside className="hidden lg:sticky lg:top-8 lg:block">
          <div className="rounded-xl border border-line bg-paper p-5">
            <h2 className="text-[1.0625rem] font-semibold tracking-tight text-ink">Summary</h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <SummaryRow label="Client" value={client?.name ?? "Not chosen"} muted={!client} />
              <SummaryRow
                label="Deadline"
                value={deadline ? `${formatDate(deadline)}${daysUntilDeadline !== null ? ` · ${formatDaysLeft(daysUntilDeadline)}` : ""}` : "Not set"}
                muted={!deadline}
              />
              <SummaryRow label="Items" value={`${fields.length} ${fields.length === 1 ? "item" : "items"} · ${totalQuantity} pcs`} />
              <SummaryRow label="Grand total" value={money.grandTotal === null ? "Not set" : formatMoney(money.grandTotal)} muted={money.grandTotal === null} />
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <SaveButton pending={pending} uploading={uploading.size > 0} disabled={saveDisabled} label={saveLabel} />
              <Button asChild variant="ghost">
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            </div>
            {isDirty && !pending && <p className="mt-3 text-center text-caption text-stone">You have unsaved changes.</p>}
          </div>
        </aside>

        {/* Phone action bar, above the bottom navigation */}
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1 text-caption text-stone">
              <p className="truncate font-semibold text-ink">{client?.name ?? "No client yet"}</p>
              <p className="truncate tabular">
                {fields.length} {fields.length === 1 ? "item" : "items"}
                {money.grandTotal !== null ? ` · ${formatMoney(money.grandTotal)}` : ""}
              </p>
            </div>
            <SaveButton pending={pending} uploading={uploading.size > 0} disabled={saveDisabled} label={saveLabel} compact />
          </div>
        </div>
      </form>

      <AlertDialog open={unsaved.pendingHref !== null} onOpenChange={(open) => !open && unsaved.stay()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>Your changes to this order haven&apos;t been saved and will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={unsaved.leave}>
              Leave page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}

function SaveButton({ pending, uploading, disabled, label, compact }: { pending: boolean; uploading: boolean; disabled: boolean; label: string; compact?: boolean }) {
  return (
    <Button type="submit" size={compact ? "default" : "lg"} disabled={disabled} className={compact ? "shrink-0 px-6" : "w-full"}>
      {pending ? <Spinner /> : uploading ? <CloudUpload aria-hidden="true" /> : null}
      {pending ? "Saving…" : uploading ? "Uploading photos…" : label}
    </Button>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-card">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <SectionHeading id={id} title={title} description={description} />
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function SectionHeading({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div>
      <h2 id={id} className="text-[1.0625rem] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-stone">{description}</p>}
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-stone">{label}</dt>
      <dd className={strong ? "font-bold text-ink" : "font-semibold text-ink"}>{value}</dd>
    </div>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption font-semibold text-stone">{label}</dt>
      <dd className={muted ? "text-stone" : "font-semibold text-ink tabular"}>{value}</dd>
    </div>
  )
}

function RupeeInput({ invalid, ...props }: React.ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-stone">
        Rs
      </span>
      <Input inputMode="numeric" autoComplete="off" placeholder="0" aria-invalid={invalid} className="pl-11 tabular" {...props} />
    </div>
  )
}

export { blankValues }
