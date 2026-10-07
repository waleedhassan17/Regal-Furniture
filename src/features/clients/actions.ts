"use server"

import { refresh, revalidatePath } from "next/cache"
import { createAction, friendlyDbError } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { clientSchema, updateClientSchema } from "@/features/clients/schema"
import { searchClientOptions, type ClientOption } from "@/features/clients/queries"
import { z } from "zod"

export const createClientAction = createAction(
  { schema: clientSchema, guard: "admin", name: "clients.create" },
  async (input) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .insert(input)
      .select("id, name, phone, company, address, city")
      .single()
    if (error || !data) return { ok: false, error: friendlyDbError(error, "We couldn't add this client. Please try again.") }
    revalidatePath("/clients")
    return { ok: true, data: data satisfies ClientOption, message: `${data.name} added` }
  }
)

export const updateClientAction = createAction(
  { schema: updateClientSchema, guard: "admin", name: "clients.update" },
  async ({ id, ...input }) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("clients").update(input).eq("id", id).select("id, name").maybeSingle()
    if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save these changes. Please try again.") }
    if (!data) return { ok: false, error: "This client no longer exists." }
    refresh()
    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
    return { ok: true, data: { id: data.id }, message: "Client details saved" }
  }
)

export const searchClientsAction = createAction(
  { schema: z.object({ q: z.string().max(100) }), guard: "admin", name: "clients.search" },
  async ({ q }) => ({ ok: true, data: await searchClientOptions(q) })
)
