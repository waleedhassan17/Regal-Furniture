"use server"

import { refresh, revalidatePath } from "next/cache"
import { z } from "zod"
import { createAction, friendlyDbError, type ActionResult } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { orderFormSchema } from "@/features/orders/schema"
import { ITEM_STATUSES, PRODUCTION_STATUSES, PRODUCTION_STATUS_LABEL } from "@/lib/domain/status"

const IMAGE_BUCKET = "item-images"

/** Marks every view of this order stale and refreshes the page the user is on. */
function revalidateOrder(orderId: string) {
  refresh()
  revalidatePath("/dashboard")
  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
}

/**
 * Creates or updates an order with its items and amounts in one transaction
 * (the `save_order` database function). Photos are already in storage; any photo
 * no longer referenced after the save is removed.
 */
export const saveOrderAction = createAction(
  { schema: orderFormSchema, guard: "admin", name: "orders.save" },
  async (input): Promise<ActionResult<{ id: string; orderNumber: string; created: boolean }>> => {
    const supabase = await createClient()

    const [{ data: existing }, { data: previousItems }] = await Promise.all([
      supabase.from("orders").select("id, responsible_id").eq("id", input.id).maybeSingle(),
      supabase.from("order_items").select("image_path").eq("order_id", input.id),
    ])

    // A newly chosen person must be active; keeping the current (since deactivated) person is allowed.
    if (input.responsible_id && input.responsible_id !== existing?.responsible_id) {
      const { data: person } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", input.responsible_id)
        .eq("is_active", true)
        .maybeSingle()
      if (!person) {
        return {
          ok: false,
          error: "The person responsible is no longer active. Choose someone else.",
          fieldErrors: { responsible_id: ["Choose someone who is still on the team."] },
        }
      }
    }

    const payload = {
      ...input,
      finance: {
        order_amount: input.finance?.order_amount ?? null,
        delivery_charges: input.finance?.delivery_charges ?? 0,
      },
    }
    const { error } = await supabase.rpc("save_order", { payload })
    if (error) {
      console.error("[orders.save] save_order failed", error.code, error.message)
      return { ok: false, error: friendlyDbError(error, "We couldn't save the order. Nothing was changed — please try again.") }
    }

    const kept = new Set(input.items.map((i) => i.image_path).filter((p): p is string => !!p))
    const orphaned = (previousItems ?? []).map((i) => i.image_path).filter((p): p is string => !!p && !kept.has(p))
    if (orphaned.length) {
      const { error: removeError } = await supabase.storage.from(IMAGE_BUCKET).remove(orphaned)
      if (removeError) console.error("[orders.save] could not remove replaced photos", removeError.message)
    }

    const { data: saved } = await supabase.from("orders").select("order_number").eq("id", input.id).single()
    revalidateOrder(input.id)
    if (existing) revalidatePath(`/orders/${input.id}/edit`)
    revalidatePath(`/clients/${input.client_id}`)
    return {
      ok: true,
      data: { id: input.id, orderNumber: saved?.order_number ?? "", created: !existing },
      message: existing ? "Order updated" : "Order created",
    }
  }
)

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(PRODUCTION_STATUSES),
})

/** Any active user may change production status (the database limits staff to this column). */
export const changeOrderStatusAction = createAction(
  { schema: statusSchema, guard: "user", name: "orders.status" },
  async ({ orderId, status }) => {
    const supabase = await createClient()
    const { data: before } = await supabase.from("orders").select("status, order_number").eq("id", orderId).maybeSingle()
    if (!before) return { ok: false, error: "This order no longer exists, or it has been archived." }
    if (before.status === status) {
      return { ok: true, data: { previous: before.status, orderNumber: before.order_number }, message: "No change" }
    }

    const { data, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select("id").maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't change the status. Please try again.") }
    if (!data) return { ok: false, error: "Archived orders can't be changed. Ask an admin to restore it first." }
    revalidateOrder(orderId)
    return {
      ok: true,
      data: { previous: before.status, orderNumber: before.order_number },
      message: `${before.order_number} is now ${PRODUCTION_STATUS_LABEL[status].toLowerCase()}`,
    }
  }
)

const itemStatusSchema = z.object({
  orderId: z.uuid(),
  itemId: z.uuid(),
  status: z.enum(ITEM_STATUSES),
})

export const changeItemStatusAction = createAction(
  { schema: itemStatusSchema, guard: "user", name: "orders.itemStatus" },
  async ({ orderId, itemId, status }) => {
    const supabase = await createClient()
    const { data: before } = await supabase.from("order_items").select("status").eq("id", itemId).eq("order_id", orderId).maybeSingle()
    if (!before) return { ok: false, error: "This item no longer exists." }
    const { data, error } = await supabase
      .from("order_items")
      .update({ status })
      .eq("id", itemId)
      .eq("order_id", orderId)
      .select("id")
      .maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't update the item. Please try again.") }
    if (!data) return { ok: false, error: "Items on archived orders can't be changed." }
    revalidateOrder(orderId)
    return { ok: true, data: { previous: before.status } }
  }
)

const noteSchema = z.object({
  orderId: z.uuid(),
  body: z.string().trim().min(1, "Write a note first.").max(2000, "Keep notes under 2,000 characters."),
})

export const addNoteAction = createAction({ schema: noteSchema, guard: "user", name: "orders.addNote" }, async ({ orderId, body }, user) => {
  const supabase = await createClient()
  const { error } = await supabase.from("order_notes").insert({ order_id: orderId, body, author_id: user.id })
  if (error) return { ok: false, error: friendlyDbError(error, "We couldn't add your note. Please try again.") }
  refresh()
  revalidatePath(`/orders/${orderId}`)
  return { ok: true, data: undefined, message: "Note added" }
})

export const deleteNoteAction = createAction(
  { schema: z.object({ orderId: z.uuid(), noteId: z.uuid() }), guard: "admin", name: "orders.deleteNote" },
  async ({ orderId, noteId }) => {
    const supabase = await createClient()
    const { error } = await supabase.from("order_notes").delete().eq("id", noteId).eq("order_id", orderId)
    if (error) return { ok: false, error: friendlyDbError(error) }
    refresh()
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, data: undefined, message: "Note removed" }
  }
)

export const setArchivedAction = createAction(
  { schema: z.object({ orderId: z.uuid(), archived: z.boolean() }), guard: "admin", name: "orders.archive" },
  async ({ orderId, archived }) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("orders")
      .update({ is_archived: archived })
      .eq("id", orderId)
      .select("order_number, client_id")
      .maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error) }
    if (!data) return { ok: false, error: "This order no longer exists." }
    revalidateOrder(orderId)
    revalidatePath(`/clients/${data.client_id}`)
    return { ok: true, data: undefined, message: archived ? `${data.order_number} archived` : `${data.order_number} restored` }
  }
)
