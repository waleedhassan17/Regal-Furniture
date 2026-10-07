"use server"

import { refresh, revalidatePath } from "next/cache"
import { createAction, friendlyDbError } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { companySchema } from "@/features/company/schema"

export const updateCompanyAction = createAction({ schema: companySchema, guard: "admin", name: "company.update" }, async (v) => {
  const supabase = await createClient()
  const { error } = await supabase.from("company").upsert(
    {
      id: 1,
      name: v.company_name,
      phone: v.company_phone,
      email: v.company_email,
      address: v.company_address,
      city: v.company_city,
      website: v.company_website,
    },
    { onConflict: "id" }
  )
  if (error) return { ok: false, error: friendlyDbError(error, "We couldn't save the company details. Please try again.") }
  refresh()
  revalidatePath("/settings")
  return { ok: true, data: undefined, message: "Company details saved" }
})
