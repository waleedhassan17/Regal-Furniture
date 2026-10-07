import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <span
        className="inline-flex size-12 items-center justify-center rounded-xl border"
        style={
          positive
            ? { backgroundColor: "var(--st-done-bg)", borderColor: "var(--st-done-bd)", color: "var(--st-done-fg)" }
            : { backgroundColor: "var(--subtle)", borderColor: "var(--line)", color: "var(--stone)" }
        }
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-[1.125rem] leading-tight font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
