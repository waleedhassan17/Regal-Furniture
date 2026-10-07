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
