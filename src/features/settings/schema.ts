import { z } from "zod"

const days = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => /^\d{1,3}$/.test(v) && Number(v) <= max, `${label}: enter a whole number from 0 to ${max}.`)
    .transform(Number)

export const settingsSchema = z.object({
  due_soon_days: days(60, "Due soon"),
  start_warning_days: days(180, "Start warning"),
  not_started_grace_days: days(60, "Grace period"),
})
export type SettingsFormValues = z.input<typeof settingsSchema>
export type SettingsValues = z.output<typeof settingsSchema>
