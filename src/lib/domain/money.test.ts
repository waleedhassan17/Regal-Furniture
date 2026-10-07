import { describe, expect, it } from "vitest"
import { computeOrderMoney } from "@/lib/domain/money"

describe("computeOrderMoney", () => {
  it("adds delivery to the order amount and subtracts payments", () => {
    const m = computeOrderMoney({ orderAmount: 125000, deliveryCharges: 5000, payments: [{ amount: 30000 }, { amount: 20000 }] })
    expect(m.grandTotal).toBe(130000)
    expect(m.received).toBe(50000)
    expect(m.remaining).toBe(80000)
    expect(m.overpaid).toBe(0)
    expect(m.isSettled).toBe(false)
  })
  it("treats missing delivery charges as zero", () => {
    const m = computeOrderMoney({ orderAmount: 40000, deliveryCharges: null, payments: [] })
    expect(m.grandTotal).toBe(40000)
    expect(m.remaining).toBe(40000)
  })
  it("is settled when fully paid", () => {
    const m = computeOrderMoney({ orderAmount: 40000, deliveryCharges: 0, payments: [{ amount: 40000 }] })
    expect(m.remaining).toBe(0)
    expect(m.isSettled).toBe(true)
  })
  it("reports overpayment as a negative remaining balance", () => {
    const m = computeOrderMoney({ orderAmount: 40000, deliveryCharges: 2000, payments: [{ amount: 45000 }] })
    expect(m.remaining).toBe(-3000)
    expect(m.overpaid).toBe(3000)
    expect(m.isSettled).toBe(true)
  })
  it("has no total or remaining when the amount is not set yet", () => {
    const m = computeOrderMoney({ orderAmount: null, deliveryCharges: 3000, payments: [{ amount: 10000 }] })
    expect(m.grandTotal).toBeNull()
    expect(m.remaining).toBeNull()
    expect(m.received).toBe(10000)
    expect(m.isSettled).toBe(false)
    expect(m.overpaid).toBe(0)
  })
  it("handles an order with no payments", () => {
    const m = computeOrderMoney({ orderAmount: 0, deliveryCharges: 0, payments: [] })
    expect(m.grandTotal).toBe(0)
    expect(m.isSettled).toBe(true)
  })
})
