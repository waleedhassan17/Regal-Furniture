/** "5 days left", "1 day left", "Due today", "1 day overdue", "3 days overdue". */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return "Due today"
  const n = Math.abs(daysLeft)
  const unit = n === 1 ? "day" : "days"
  return daysLeft > 0 ? `${n} ${unit} left` : `${n} ${unit} overdue`
}
