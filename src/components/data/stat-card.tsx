import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tone } from "@/components/data/status-badge"

type StatCardProps = {
  label: string
  value: number | string
  href: string
  icon: LucideIcon
  hint?: string
  /** For counts that need action: the number takes the status colour when it isn't zero. */
  tone?: Tone
}

/** Dashboard count: label, a large figure and a link to the matching filtered list. */
export function StatCard({ label, value, href, icon: Icon, hint, tone }: StatCardProps) {
  const isZero = value === 0
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex min-h-[8.5rem] flex-col rounded-xl border border-line bg-paper p-5 transition-colors duration-(--duration-fast) hover:border-line-strong hover:bg-subtle/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-stone">{label}</span>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-stone/70" />
      </span>
      <span
        className={cn("mt-auto pt-4 text-[2.25rem] leading-none font-semibold tracking-tight tabular", isZero ? "text-stone/60" : "text-ink")}
        style={tone && !isZero ? { color: `var(--st-${tone}-fg)` } : undefined}
      >
        {value}
      </span>
      {hint && <span className="mt-2 text-caption text-stone">{hint}</span>}
    </Link>
  )
}
