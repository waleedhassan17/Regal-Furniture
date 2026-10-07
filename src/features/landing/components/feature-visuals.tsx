import { Progress } from "@/components/ui/progress"
import { ItemStatusBadge } from "@/components/data/status-badge"

/** Static product fragments for the landing page's feature rows (illustrative, not live data). */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-line bg-canvas p-5 select-none sm:p-8">
      {children}
    </div>
  )
}

export function RemindersVisual() {
  const tiles = [
    { label: "Overdue", value: 2, hint: "Deadline has passed", color: "var(--st-overdue-fg)" },
    { label: "Due soon", value: 3, hint: "Within 3 days", color: "var(--st-due-fg)" },
    { label: "Needs to start", value: 1, hint: "Still marked New", color: "var(--st-start-fg)" },
    { label: "Ready for delivery", value: 4, hint: "Waiting to go out", color: "var(--ink)" },
  ]
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-line bg-paper p-4">
            <p className="text-caption font-medium text-stone">{t.label}</p>
            <p className="mt-3 text-[1.75rem] leading-none font-semibold tracking-tight tabular" style={{ color: t.color }}>
              {t.value}
            </p>
            <p className="mt-2 text-[0.6875rem] text-stone">{t.hint}</p>
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function FactoryVisual() {
  const items = [
    { name: "Student desk (double)", qty: 20, status: "ready" as const },
    { name: "Student chair", qty: 40, status: "in_production" as const },
    { name: "Teacher table", qty: 2, status: "pending" as const },
  ]
  return (
    <Frame>
      <div className="mx-auto max-w-sm overflow-hidden rounded-[1.75rem] border-[6px] border-ink bg-paper shadow-(--shadow-raised)">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[0.6875rem] text-stone tabular">RF-2026-0147</p>
          <p className="text-sm font-semibold text-ink">Grade 6 classrooms</p>
        </div>
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-[0.6875rem]">
            <span className="font-semibold text-ink">1 of 3 items ready</span>
            <span className="text-stone">Due today</span>
          </div>
          <Progress tone="done" value={33} className="mt-2" />
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-[0.8125rem] font-medium text-ink">{item.name}</span>
                <span className="text-[0.6875rem] text-stone tabular">× {item.qty}</span>
              </span>
              <ItemStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  )
}

export function SharingVisual() {
  return (
    <Frame>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] sm:items-start">
        <div className="rounded-lg border border-line bg-paper p-4 shadow-(--shadow-card)">
          <div className="flex items-start justify-between border-b border-ink pb-2">
            <p className="text-[0.6875rem] font-extrabold tracking-[0.14em] text-ink">REGAL</p>
            <p className="text-[0.75rem] font-semibold text-ink tabular">RF-2026-0147</p>
          </div>
          <p className="mt-2 text-[0.6875rem] font-semibold text-ink">Job sheet</p>
          {[
            ["1", "Student desk (double)", "20"],
            ["2", "Student chair", "40"],
            ["3", "Teacher table", "2"],
          ].map(([n, name, qty]) => (
            <div key={n} className="mt-2 flex border border-ink text-[0.6875rem]">
              <span className="w-5 shrink-0 border-r border-ink bg-subtle py-1 text-center font-semibold">{n}</span>
              <span className="flex-1 truncate px-2 py-1 font-medium">{name}</span>
              <span className="w-8 shrink-0 border-l border-ink py-1 text-center font-semibold tabular">{qty}</span>
            </div>
          ))}
          <p className="mt-3 text-[0.625rem] text-stone">No prices on the factory copy.</p>
        </div>
        <div className="rounded-2xl rounded-tr-sm border border-line bg-paper p-3.5 text-[0.75rem] leading-relaxed text-ink shadow-(--shadow-card)">
          <p className="font-semibold">Order RF-2026-0147 — Grade 6 classrooms</p>
          <p className="mt-1 text-stone">Deadline: 08 Oct (due today)</p>
          <p className="mt-1 text-stone">1. Student desk (double) × 20</p>
          <p className="text-stone">2. Student chair × 40</p>
          <p className="mt-1 text-regal">Open in portal →</p>
        </div>
      </div>
    </Frame>
  )
}
