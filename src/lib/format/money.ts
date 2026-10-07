const grouping = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

/** Formats whole rupees as `Rs 125,000`. Negative amounts render as `-Rs 5,000`. */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—"
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? "-" : ""
  return `${sign}Rs ${grouping.format(Math.abs(rounded))}`
}
