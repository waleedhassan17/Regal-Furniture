import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HexFrame } from "@/components/brand/hexagon"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  tone?: "neutral" | "positive"
  className?: string
}

/** Calm, helpful placeholder for empty lists and "all clear" moments. */
export function EmptyState({ icon: Icon, title, description, action, tone = "neutral", className }: EmptyStateProps) {
  const positive = tone === "positive"
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center sm:py-16", className)}>
      <HexFrame
        size={72}
        strokeWidth={4}
        stroke={positive ? "var(--st-done-dot)" : "var(--sand-strong)"}
        fill={positive ? "var(--st-done-bg)" : "var(--paper)"}
      >
        <Icon aria-hidden="true" className="size-6" style={{ color: positive ? "var(--st-done-fg)" : "var(--stone)" }} />
      </HexFrame>
      <h3 className="mt-5 font-heading text-[1.5rem] leading-tight font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
