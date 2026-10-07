import { describe, expect, it } from "vitest"
import { buildWhatsAppMessage, whatsAppShareUrl } from "@/features/orders/whatsapp"

const base = {
  orderId: "7d3c1d5e-0000-4000-8000-000000000001",
  orderNumber: "RF-2026-0012",
  clientName: "Hamza Sb",
  deliveryDeadline: "2026-10-13",
  daysLeft: 5,
  status: "in_production" as const,
  responsibleName: "Imran",
  specialInstructions: "Deliver after 4pm",
  items: [
    { name: "Executive table", quantity: 1, size: 'L= 96" W= 42"' },
    { name: "Visitor chair", quantity: 6, size: null },
  ],
  siteUrl: "https://orders.example.com",
}

describe("buildWhatsAppMessage", () => {
  it("summarises the order with a link back", () => {
    const text = buildWhatsAppMessage(base)
    expect(text).toContain("*Order RF-2026-0012* — Hamza Sb")
    expect(text).toContain("Deadline: 13 Oct 2026 (5 days left)")
    expect(text).toContain('1. Executive table × 1 — L= 96" W= 42"')
    expect(text).toContain("2. Visitor chair × 6")
    expect(text).toContain("Note: Deliver after 4pm")
    expect(text).toContain("https://orders.example.com/orders/7d3c1d5e-0000-4000-8000-000000000001")
  })
  it("never mentions money", () => {
    const text = buildWhatsAppMessage(base)
    expect(text).not.toMatch(/\bRs\b|rupee|amount|balance|\bpaid\b|payment/i)
  })
  it("caps very long item lists", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ name: `Desk ${i + 1}`, quantity: 1, size: null }))
    const text = buildWhatsAppMessage({ ...base, items })
    expect(text).toContain("25. Desk 25")
    expect(text).not.toContain("26. Desk 26")
    expect(text).toContain("…and 15 more items")
  })
  it("encodes the message for wa.me", () => {
    expect(whatsAppShareUrl("a & b\nc")).toBe("https://wa.me/?text=a%20%26%20b%0Ac")
  })
})
