import { z } from "zod"
import { optionalPhone, optionalText, requiredText, uuid } from "@/lib/validation/fields"

export const clientSchema = z.object({
  name: requiredText(160, "Enter the client's name."),
  phone: optionalPhone,
  alt_phone: optionalPhone,
  company: optionalText(160, "Company"),
  address: optionalText(500, "Address"),
  city: optionalText(80, "City"),
  notes: optionalText(2000, "Notes"),
})

export type ClientFormValues = z.input<typeof clientSchema>
export type ClientValues = z.output<typeof clientSchema>

export const updateClientSchema = clientSchema.extend({ id: uuid() })

export const emptyClient: ClientFormValues = {
  name: "",
  phone: "",
  alt_phone: "",
  company: "",
  address: "",
  city: "",
  notes: "",
}
