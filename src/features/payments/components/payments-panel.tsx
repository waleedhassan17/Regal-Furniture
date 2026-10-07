"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Banknote, EllipsisVertical, Pencil, Plus, Trash2, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Field, FormAlert, describedBy } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { computeOrderMoney } from "@/lib/domain/money"
import { formatMoney } from "@/lib/format/money"
import { formatDate } from "@/lib/format/date"
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/domain/status"
import { addPaymentAction, deletePaymentAction, updatePaymentAction } from "@/features/payments/actions"
import { paymentSchema, type PaymentFormValues, type PaymentValues } from "@/features/payments/schema"
import type { PaymentRow } from "@/features/orders/queries"

type PaymentsPanelProps = {
  orderId: string
  orderAmount: number | null
  deliveryCharges: number
  payments: PaymentRow[]
  today: string
  editHref: string
}

/** Admin-only money panel: totals, received, remaining, and the payment history. */
export function PaymentsPanel({ orderId, orderAmount, deliveryCharges, payments, today, editHref }: PaymentsPanelProps) {
  const money = computeOrderMoney({ orderAmount, deliveryCharges, payments })
  const [dialog, setDialog] = useState<{ mode: "add" } | { mode: "edit"; payment: PaymentRow } | null>(null)
  const [deleting, setDeleting] = useState<PaymentRow | null>(null)
  const [pendingDelete, startDelete] = useTransition()

  const remainingTone =
    money.remaining === null ? "text-stone" : money.remaining > 0 ? "text-regal" : "text-[var(--st-done-fg)]"

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle className="flex items-center gap-2">
          <Wallet aria-hidden="true" className="size-[18px] text-stone" /> Payments
        </CardTitle>
        <Button size="sm" onClick={() => setDialog({ mode: "add" })}>
          <Plus aria-hidden="true" /> Add payment
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm tabular">
          <Stat label="Order amount" value={orderAmount === null ? "Not set" : formatMoney(orderAmount)} muted={orderAmount === null} />
          <Stat label="Delivery charges" value={formatMoney(deliveryCharges)} />
          <Stat label="Grand total" value={money.grandTotal === null ? "—" : formatMoney(money.grandTotal)} strong />
          <Stat label="Received" value={formatMoney(money.received)} strong />
        </dl>
        <div className="flex items-end justify-between gap-3 rounded-lg border border-sand bg-sand-soft/60 px-4 py-3">
          <div>
            <p className="text-caption font-semibold text-stone">{money.overpaid > 0 ? "Overpaid by" : "Remaining"}</p>
            <p className={cn("font-display text-[1.875rem] leading-tight font-bold tabular", remainingTone)}>
              {money.remaining === null ? "Amount not set" : money.overpaid > 0 ? formatMoney(money.overpaid) : formatMoney(money.remaining)}
            </p>
          </div>
          {money.isSettled && money.overpaid === 0 && (
            <span className="rounded-full bg-[var(--st-done-bg)] px-2.5 py-1 text-caption font-bold text-[var(--st-done-fg)]">Paid in full</span>
          )}
        </div>
        {orderAmount === null && (
          <p className="text-caption text-stone">
            Set the order amount on the{" "}
            <a href={editHref} className="font-semibold text-ink underline underline-offset-4">
              edit page
            </a>{" "}
            to see the remaining balance.
          </p>
        )}

        {payments.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-sand-strong px-4 py-4 text-sm text-stone">
            <Banknote aria-hidden="true" className="size-5 shrink-0" /> No payments recorded yet.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-sand rounded-lg border border-sand">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink tabular">{formatMoney(p.amount)}</p>
                  <p className="truncate text-caption text-stone">
                    {formatDate(p.paid_on)} · {PAYMENT_METHOD_LABEL[p.method]}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for payment of ${formatMoney(p.amount)} on ${formatDate(p.paid_on)}`}>
                      <EllipsisVertical aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => setDialog({ mode: "edit", payment: p })}>
                      <Pencil aria-hidden="true" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}>
                      <Trash2 aria-hidden="true" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit payment" : "Add payment"}</DialogTitle>
            <DialogDescription>
              {money.remaining !== null && money.remaining > 0 ? `${formatMoney(money.remaining)} is still due on this order.` : "Record money received for this order."}
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <PaymentForm
              key={dialog.mode === "edit" ? dialog.payment.id : "new"}
              orderId={orderId}
              today={today}
              payment={dialog.mode === "edit" ? dialog.payment : null}
              suggestedAmount={money.remaining !== null && money.remaining > 0 ? money.remaining : null}
              onDone={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${formatMoney(deleting.amount)} received on ${formatDate(deleting.paid_on)} will be removed and the balance recalculated.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingDelete}
              onClick={(e) => {
                e.preventDefault()
                if (!deleting) return
                startDelete(async () => {
                  const result = await deletePaymentAction({ orderId, paymentId: deleting.id })
                  if (!result.ok) toast.error(result.error)
                  else toast.success(result.message ?? "Payment removed")
                  setDeleting(null)
                })
              }}
            >
              {pendingDelete && <Spinner />} Remove payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function PaymentForm({
  orderId,
  today,
  payment,
  suggestedAmount,
  onDone,
}: {
  orderId: string
  today: string
  payment: PaymentRow | null
  suggestedAmount: number | null
  onDone: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<PaymentFormValues, unknown, PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      orderId,
      amount: payment ? String(payment.amount) : "",
      paid_on: payment?.paid_on ?? today,
      method: payment?.method ?? "cash",
      note: payment?.note ?? "",
    },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit(() => {
    setServerError(null)
    const values = form.getValues()
    startTransition(async () => {
      const result = payment ? await updatePaymentAction({ ...values, paymentId: payment.id }) : await addPaymentAction(values)
      if (!result.ok) {
        setServerError(result.error)
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (field in values) form.setError(field as keyof PaymentFormValues, { message: messages[0] })
        }
        return
      }
      toast.success(result.message ?? "Saved")
      onDone()
    })
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <Field label="Amount received" htmlFor="pay-amount" error={errors.amount?.message}>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-stone">
            Rs
          </span>
          <Input
            id="pay-amount"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            className="pl-11 tabular"
            aria-invalid={!!errors.amount}
            aria-describedby={describedBy("pay-amount", { error: errors.amount })}
            {...form.register("amount")}
          />
        </div>
        {!payment && suggestedAmount !== null && (
          <button
            type="button"
            onClick={() => form.setValue("amount", String(suggestedAmount), { shouldValidate: true })}
            className="self-start text-caption font-semibold text-regal underline-offset-4 hover:underline"
          >
            Fill the remaining {formatMoney(suggestedAmount)}
          </button>
        )}
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Date received" htmlFor="pay-date" error={errors.paid_on?.message}>
          <Input id="pay-date" type="date" max={today} aria-invalid={!!errors.paid_on} {...form.register("paid_on")} />
        </Field>
        <Field label="Method" htmlFor="pay-method" error={errors.method?.message}>
          <NativeSelect id="pay-method" {...form.register("method")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Note" htmlFor="pay-note" error={errors.note?.message} optional>
        <Input id="pay-note" autoComplete="off" placeholder="e.g. Cheque no. 004512, advance" {...form.register("note")} />
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {payment ? "Save payment" : "Record payment"}
        </Button>
      </div>
    </form>
  )
}

function Stat({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div>
      <dt className="text-caption font-semibold text-stone">{label}</dt>
      <dd className={cn("mt-0.5", strong ? "font-bold text-ink" : "font-semibold text-ink", muted && "font-medium text-stone")}>{value}</dd>
    </div>
  )
}
