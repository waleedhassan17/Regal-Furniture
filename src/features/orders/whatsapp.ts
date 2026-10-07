import { formatDate } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"
import { PRODUCTION_STATUS_LABEL, type ProductionStatus } from "@/lib/domain/status"

type ShareInput = {
  orderId: string
  orderNumber: string
  clientName: string
  deliveryDeadline: string
  daysLeft: number
  status: ProductionStatus
  responsibleName: string | null
  specialInstructions: string | null
  items: ReadonlyArray<{ name: string; quantity: number; size: string | null }>
  siteUrl: string
}

const MAX_ITEMS_LISTED = 25

/**
 * Plain-text order summary for WhatsApp. Never includes prices: it is shared with the
 * factory group. *Bold* uses WhatsApp formatting.
 */
export function buildWhatsAppMessage(input: ShareInput): string {
  const lines: string[] = [
    `*Order ${input.orderNumber}* — ${input.clientName}`,
    `Deadline: ${formatDate(input.deliveryDeadline)} (${formatDaysLeft(input.daysLeft)})`,
    `Status: ${PRODUCTION_STATUS_LABEL[input.status]}`,
  ]
  if (input.responsibleName) lines.push(`Responsible: ${input.responsibleName}`)
  lines.push("", "*Items*")
  input.items.slice(0, MAX_ITEMS_LISTED).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name} × ${item.quantity}${item.size ? ` — ${item.size}` : ""}`)
  })
  if (input.items.length > MAX_ITEMS_LISTED) lines.push(`…and ${input.items.length - MAX_ITEMS_LISTED} more items`)
  if (input.specialInstructions) lines.push("", `Note: ${input.specialInstructions}`)
  lines.push("", `Open in portal: ${input.siteUrl}/orders/${input.orderId}`)
  return lines.join("\n")
}

/** wa.me opens the WhatsApp app on phones and WhatsApp Web/Desktop on computers. */
export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
