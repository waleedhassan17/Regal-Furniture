import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { StatusBadge } from "@/components/data/status-badge"

const ROWS = [
  { title: "Reception counter & visitor chairs", number: "RF-2026-0142", days: -2, attention: "overdue", status: "in_production" },
  { title: "Classroom desks × 40", number: "RF-2026-0147", days: 0, attention: "due_soon", status: "in_production" },
  { title: "Executive table & side rack", number: "RF-2026-0151", days: 9, attention: "needs_to_start", status: "new" },
] as const

const STATS = [
  { label: "Overdue", value: 2, color: "var(--st-overdue-fg)" },
  { label: "Due soon", value: 3, color: "var(--st-due-fg)" },
  { label: "In production", value: 8, color: "var(--ink)" },
]

/** Static, illustrative preview of the dashboard for the landing page (not live data). */
export function ProductPreview() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-regal p-5 sm:p-8 lg:p-10">
      <div className="overflow-hidden rounded-xl border border-black/5 bg-paper shadow-(--shadow-raised) select-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-sm font-semibold text-ink">Dashboard</p>
          <p className="text-caption text-stone">Thursday 08 Oct</p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-b border-line p-4 sm:p-5">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-lg border border-line p-3">
              <p className="text-[0.6875rem] font-medium text-stone sm:text-caption">{s.label}</p>
              <p className="mt-2 text-[1.5rem] leading-none font-semibold tracking-tight tabular" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 pt-3.5 pb-1">
          <p className="text-caption font-semibold text-ink">Needs attention</p>
        </div>
        <ul className="divide-y divide-line">
          {ROWS.map((row) => (
            <li key={row.number} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-semibold text-ink">{row.title}</p>
                <p className="text-[0.6875rem] text-stone tabular">{row.number}</p>
              </div>
              <DaysLeftBadge size="sm" daysLeft={row.days} attention={row.attention} status={row.status} />
              <span className="hidden sm:inline-flex">
                <StatusBadge status={row.status} size="sm" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
