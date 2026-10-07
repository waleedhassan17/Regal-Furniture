import { cn } from "@/lib/utils"
import {
  ATTENTION_LABEL,
  ITEM_STATUS_LABEL,
  PRODUCTION_STATUS_LABEL,
  type AttentionLevel,
  type ItemStatus,
  type ProductionStatus,
} from "@/lib/domain/status"

/** Colour families defined as tokens in globals.css (--st-<tone>-fg/bg/bd/dot). */
export type Tone = "overdue" | "due" | "start" | "track" | "done" | "progress" | "ready" | "hold" | "cancel"

export const PRODUCTION_STATUS_TONE: Record<ProductionStatus, Tone> = {
  new: "track",
  in_production: "progress",
  ready_for_delivery: "ready",
  delivered: "done",
  on_hold: "hold",
  cancelled: "cancel",
}

export const ITEM_STATUS_TONE: Record<ItemStatus, Tone> = {
  pending: "track",
  in_production: "progress",
  ready: "done",
}

export const ATTENTION_TONE: Record<AttentionLevel, Tone> = {
  overdue: "overdue",
  due_soon: "due",
  needs_to_start: "start",
  on_track: "track",
}

export function toneStyle(tone: Tone): React.CSSProperties {
  return {
    color: `var(--st-${tone}-fg)`,
    backgroundColor: `var(--st-${tone}-bg)`,
    borderColor: `var(--st-${tone}-bd)`,
  }
}

type PillProps = {
  tone: Tone
  children: React.ReactNode
  size?: "sm" | "md"
  className?: string
  dot?: boolean
}

/** Rounded status pill. Colour is always paired with a text label. */
export function Pill({ tone, children, size = "md", className, dot = true }: PillProps) {
  return (
    <span
      style={toneStyle(tone)}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap tabular",
        size === "md" ? "h-7 px-2.5 text-[0.75rem]" : "h-6 px-2 text-[0.6875rem]",
        className
      )}
    >
      {dot && (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: `var(--st-${tone}-dot)` }} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status, size, className }: { status: ProductionStatus; size?: "sm" | "md"; className?: string }) {
  return (
    <Pill tone={PRODUCTION_STATUS_TONE[status]} size={size} className={className}>
      {PRODUCTION_STATUS_LABEL[status]}
    </Pill>
  )
}

export function ItemStatusBadge({ status, size = "sm", className }: { status: ItemStatus; size?: "sm" | "md"; className?: string }) {
  return (
    <Pill tone={ITEM_STATUS_TONE[status]} size={size} className={className}>
      {ITEM_STATUS_LABEL[status]}
    </Pill>
  )
}

export function AttentionBadge({ level, size, className }: { level: AttentionLevel; size?: "sm" | "md"; className?: string }) {
  return (
    <Pill tone={ATTENTION_TONE[level]} size={size} className={className}>
      {ATTENTION_LABEL[level]}
    </Pill>
  )
}
