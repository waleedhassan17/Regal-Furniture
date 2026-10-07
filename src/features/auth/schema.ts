import { z } from "zod"
import { newPassword, PASSWORD_MIN, requiredEmail as emailField } from "@/lib/validation/fields"

export { PASSWORD_MIN }

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
  role: z.enum(["admin", "staff"], { message: "Choose how you're signing in." }),
  next: z.string().optional(),
})
export type SignInInput = z.input<typeof signInSchema>

export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>

export const newPasswordSchema = z
  .object({
    password: newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." })
export type NewPasswordInput = z.input<typeof newPasswordSchema>

/** Only allow same-site relative redirects after sign-in. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard"
  if (next.startsWith("/login") || next.startsWith("/auth")) return "/dashboard"
  return next
}
