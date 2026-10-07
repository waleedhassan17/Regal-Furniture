import { CalendarCheck2, CalendarClock, CalendarX2, Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDaysLeft } from "@/lib/format/days-left"
import { ATTENTION_LABEL, type AttentionLevel, type ProductionStatus } from "@/lib/domain/status"
import { ATTENTION_TONE, toneStyle, type Tone } from "@/components/data/status-badge"

type DaysLeftBadgeProps = {
  daysLeft: number
  attention: AttentionLevel | null
  status: ProductionStatus
  isArchived?: boolean
  size?: "sm" | "md"
  className?: string
}

/**
 * The single place that turns days left + attention into a badge. The colour comes from
 * the attention level computed in the database; closed orders show their outcome instead.
 */
export function DaysLeftBadge({ daysLeft, attention, status, isArchived, size = "md", className }: DaysLeftBadgeProps) {
  let tone: Tone
  let label: string
  let Icon = CalendarClock

  if (isArchived) {
    tone = "cancel"
    label = "Archived"
    Icon = CalendarCheck2
  } else if (status === "delivered") {
    tone = "done"
    label = "Delivered"
    Icon = CalendarCheck2
  } else if (status === "cancelled") {
    tone = "cancel"
    label = "Cancelled"
    Icon = CalendarX2
  } else {
    tone = attention ? ATTENTION_TONE[attention] : "track"
    label = formatDaysLeft(daysLeft)
    if (attention === "overdue") Icon = CalendarX2
    else if (attention === "needs_to_start") Icon = Hourglass
  }

  const srContext = attention && !isArchived && status !== "delivered" && status !== "cancelled" ? `${ATTENTION_LABEL[attention]}: ` : ""

  return (
    <span
      style={toneStyle(tone)}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap tabular",
        size === "md" ? "h-7 px-2.5 text-[0.75rem]" : "h-6 px-2 text-[0.6875rem]",
        className
      )}
    >
      <Icon aria-hidden="true" className={size === "md" ? "size-3.5" : "size-3"} />
      <span>
        {srContext && <span className="sr-only">{srContext}</span>}
        {label}
      </span>
    </span>
  )
}
