import { z } from "zod"
import { optionalPhone, requiredText, uuid } from "@/lib/validation/fields"
import { PASSWORD_MIN } from "@/features/auth/schema"

const tempPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(72, "Use 72 characters or fewer.")

export const newMemberSchema = z.object({
  full_name: requiredText(120, "Enter their name."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  phone: optionalPhone,
  role: z.enum(["admin", "staff"]),
  password: tempPassword,
})
export type NewMemberFormValues = z.input<typeof newMemberSchema>
export type NewMemberValues = z.output<typeof newMemberSchema>

export const roleSchema = z.object({ userId: uuid(), role: z.enum(["admin", "staff"]) })
export const activeSchema = z.object({ userId: uuid(), active: z.boolean() })
export const resetPasswordSchema = z.object({ userId: uuid(), password: tempPassword })
