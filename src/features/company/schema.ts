import { z } from "zod"
import { optionalEmail, optionalPhone, optionalText, requiredText } from "@/lib/validation/fields"

/** The company that owns this portal. Shared by registration and the Settings page. */
export const companyFields = {
  company_name: requiredText(120, "Enter the company name."),
  company_phone: optionalPhone,
  company_email: optionalEmail,
  company_city: optionalText(80, "City"),
  company_address: optionalText(300, "Address"),
  company_website: optionalText(160, "Website"),
}

export const companySchema = z.object(companyFields)
export type CompanyFormValues = z.input<typeof companySchema>
export type CompanyValues = z.output<typeof companySchema>
