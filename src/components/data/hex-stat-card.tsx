import Link from "next/link"
import { ArrowUpRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { HexFrame } from "@/components/brand/hexagon"
import type { Tone } from "@/components/data/status-badge"

type HexStatCardProps = {
  label: string
  value: number | string
  href: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
  /** Emphasise when the count needs action (red/amber number); calm when zero. */
  urgent?: boolean
}

/** Dashboard count card: hexagon-framed icon, a large figure, and a link to the filtered list. */
export function HexStatCard({ label, value, href, icon: Icon, tone = "track", hint, urgent = false }: HexStatCardProps) {
  const isZero = value === 0
  const accent = `var(--st-${tone}-dot)`
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 shadow-(--shadow-card) transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-(--shadow-raised) sm:p-5",
        urgent && !isZero ? "border-[color:var(--st-overdue-bd)]" : "border-sand hover:border-sand-strong"
      )}
    >
      {urgent && !isZero && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />}
      <div className="flex items-start justify-between gap-3">
        <HexFrame size={44} stroke={isZero ? "var(--sand-strong)" : accent} fill={isZero ? "transparent" : `var(--st-${tone}-bg)`}>
          <Icon aria-hidden="true" className="size-[18px]" style={{ color: isZero ? "var(--stone)" : `var(--st-${tone}-fg)` }} />
        </HexFrame>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-stone opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </div>
      <div className="mt-4">
        <p
          className={cn("font-display text-[2.25rem] leading-none font-semibold tracking-tight tabular sm:text-[2.5rem]", isZero ? "text-stone/70" : "text-ink")}
          style={!isZero && urgent ? { color: `var(--st-${tone}-fg)` } : undefined}
        >
          {value}
        </p>
        <p className="mt-2 text-[0.8125rem] font-bold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-caption text-stone">{hint}</p>}
      </div>
    </Link>
  )
}
