/**
 * Order money, in whole rupees. Mirrors the admin-only `order_balances` view:
 * grand total = order amount + delivery charges; remaining = grand total − received.
 * An order whose amount is not set yet has no grand total and no remaining balance.
 */
export type OrderMoneyInput = {
  orderAmount: number | null
  deliveryCharges: number | null
  payments: ReadonlyArray<{ amount: number }>
}

export type OrderMoney = {
  orderAmount: number | null
  deliveryCharges: number
  grandTotal: number | null
  received: number
  remaining: number | null
  /** Amount received beyond the grand total (0 when not overpaid or total unknown). */
  overpaid: number
  isSettled: boolean
}

export function computeOrderMoney({ orderAmount, deliveryCharges, payments }: OrderMoneyInput): OrderMoney {
  const delivery = deliveryCharges ?? 0
  const received = payments.reduce((sum, p) => sum + p.amount, 0)
  const grandTotal = orderAmount === null ? null : orderAmount + delivery
  const remaining = grandTotal === null ? null : grandTotal - received
  return {
    orderAmount,
    deliveryCharges: delivery,
    grandTotal,
    received,
    remaining,
    overpaid: remaining !== null && remaining < 0 ? -remaining : 0,
    isSettled: remaining !== null && remaining <= 0,
  }
}
