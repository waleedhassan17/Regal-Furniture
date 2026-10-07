"use server"

import { refresh, revalidatePath } from "next/cache"
import { z } from "zod"
import { createAction, friendlyDbError } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { karachiToday } from "@/lib/format/date"
import { paymentSchema, updatePaymentSchema } from "@/features/payments/schema"
import { formatMoney } from "@/lib/format/money"

function revalidateMoney(orderId: string) {
  refresh()
  revalidatePath(`/orders/${orderId}`)
  revalidatePath("/orders")
  revalidatePath("/dashboard")
  revalidatePath("/clients")
}

function checkDate(paidOn: string) {
  return paidOn > karachiToday() ? "A payment can't be dated in the future." : null
}

export const addPaymentAction = createAction(
  { schema: paymentSchema, guard: "admin", name: "payments.add" },
  async ({ orderId, amount, paid_on, method, note }, user) => {
    const dateError = checkDate(paid_on)
    if (dateError) return { ok: false, error: dateError, fieldErrors: { paid_on: [dateError] } }
    const supabase = await createClient()
    const { error } = await supabase
      .from("payments")
      .insert({ order_id: orderId, amount: amount as number, paid_on, method, note, recorded_by: user.id })
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't record this payment. Please try again.") }
    revalidateMoney(orderId)
    return { ok: true, data: undefined, message: `${formatMoney(amount)} recorded` }
  }
)

export const updatePaymentAction = createAction(
  { schema: updatePaymentSchema, guard: "admin", name: "payments.update" },
  async ({ orderId, paymentId, amount, paid_on, method, note }) => {
    const dateError = checkDate(paid_on)
    if (dateError) return { ok: false, error: dateError, fieldErrors: { paid_on: [dateError] } }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("payments")
      .update({ amount: amount as number, paid_on, method, note })
      .eq("id", paymentId)
      .eq("order_id", orderId)
      .select("id")
      .maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save this payment. Please try again.") }
    if (!data) return { ok: false, error: "This payment no longer exists." }
    revalidateMoney(orderId)
    return { ok: true, data: undefined, message: "Payment updated" }
  }
)

export const deletePaymentAction = createAction(
  { schema: z.object({ orderId: z.uuid(), paymentId: z.uuid() }), guard: "admin", name: "payments.delete" },
  async ({ orderId, paymentId }) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("payments").delete().eq("id", paymentId).eq("order_id", orderId).select("id").maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't remove this payment. Please try again.") }
    if (!data) return { ok: false, error: "This payment was already removed." }
    revalidateMoney(orderId)
    return { ok: true, data: undefined, message: "Payment removed" }
  }
)
