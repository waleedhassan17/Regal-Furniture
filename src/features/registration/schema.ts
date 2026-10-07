import { z } from "zod"
import { newPassword, optionalPhone, requiredEmail, requiredText } from "@/lib/validation/fields"
import { companyFields } from "@/features/company/schema"

export const registerSchema = z
  .object({
    ...companyFields,
    owner_name: requiredText(120, "Enter your full name."),
    owner_phone: optionalPhone,
    email: requiredEmail,
    password: newPassword,
    confirm: z.string(),
    setup_code: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." })

export type RegisterFormValues = z.input<typeof registerSchema>
export type RegisterValues = z.output<typeof registerSchema>
