import { z } from "zod"

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .pipe(z.email("Enter a valid email address."))

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
})
export type SignInInput = z.input<typeof signInSchema>

export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>

export const PASSWORD_MIN = 8

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
      .max(72, "Use 72 characters or fewer."),
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
