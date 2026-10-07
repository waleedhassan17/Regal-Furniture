import { z } from "zod"
import { isoDate, moneyInput, optionalText, uuid } from "@/lib/validation/fields"
import { PAYMENT_METHODS } from "@/lib/domain/status"

export const paymentSchema = z.object({
  orderId: uuid(),
  amount: moneyInput.refine((v) => v !== null && v > 0, "Enter the amount received."),
  paid_on: isoDate("Choose the date the payment was received."),
  method: z.enum(PAYMENT_METHODS, { message: "Choose how it was paid." }),
  note: optionalText(500, "Note"),
})

export const updatePaymentSchema = paymentSchema.extend({ paymentId: uuid() })

export type PaymentFormValues = z.input<typeof paymentSchema>
export type PaymentValues = z.output<typeof paymentSchema>
