import { z } from "zod"

/** Optional free text: trims, turns empty into null, caps length. */
export function optionalText(max: number, label = "This field") {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null)
}

export function requiredText(max: number, message: string) {
  return z.string().trim().min(1, message).max(max, `Use ${max} characters or fewer.`)
}

const PHONE = /^[+\d][\d\s\-()/]{5,39}$/

export const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || PHONE.test(v), "Enter a phone number using digits, spaces or dashes.")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)

export const isoDate = (message: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message).refine((v) => !Number.isNaN(Date.parse(v)), message)

/** Whole rupees typed by a person: accepts "125,000", "Rs 125000", blank → null. */
export const moneyInput = z
  .string()
  .trim()
  .transform((v) => v.replace(/^rs\.?\s*/i, "").replace(/[,\s]/g, ""))
  .refine((v) => v === "" || /^\d{1,11}$/.test(v), "Enter an amount in whole rupees, e.g. 125000.")
  .transform((v) => (v === "" ? null : Number(v)))

export const uuid = (message = "Invalid reference.") => z.uuid({ message })

/** Required email: trimmed and lower-cased before it is checked. */
export const requiredEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .pipe(z.email("Enter a valid email address."))

/** Optional email: blank becomes null. */
export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address, or leave it blank.")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)

export const PASSWORD_MIN = 8

export const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(72, "Use 72 characters or fewer.")
