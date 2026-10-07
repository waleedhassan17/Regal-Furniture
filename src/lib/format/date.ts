/** All business dates are calendar dates in Pakistan time. */
export const BUSINESS_TIME_ZONE = "Asia/Karachi"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Today's date in Karachi as `YYYY-MM-DD`. */
export function karachiToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

/** Formats a `YYYY-MM-DD` date (or an ISO timestamp, read in Karachi time) as `08 Oct 2026`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const iso = ISO_DATE.test(value) ? value : karachiToday(new Date(value))
  const [year, month, day] = iso.split("-")
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`
}

/** Formats a timestamp as `08 Oct 2026, 3:45 pm` in Karachi time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toLowerCase()}`)
  return `${formatDate(value)}, ${time}`
}

/** "Thursday 08 Oct 2026" in Karachi time. */
export function longToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(...parts(from))
  const b = Date.UTC(...parts(to))
  return Math.round((b - a) / 86_400_000)
}

/** Adds whole days to a `YYYY-MM-DD` date. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = parts(date)
  return new Date(Date.UTC(y, m, d + days)).toISOString().slice(0, 10)
}

function parts(date: string): [number, number, number] {
  if (!ISO_DATE.test(date)) throw new Error(`Expected YYYY-MM-DD, got "${date}"`)
  const [y, m, d] = date.split("-").map(Number)
  return [y, m - 1, d]
}
