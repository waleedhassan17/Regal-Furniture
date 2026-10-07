import { ClipboardList, LayoutDashboard, LogOut, Plus, SlidersHorizontal, UserCog, Users, Wallet } from "lucide-react"
import { Wordmark } from "@/components/brand/logo"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { StatusBadge, type Tone } from "@/components/data/status-badge"

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ClipboardList, label: "Orders" },
  { icon: Users, label: "Clients" },
  { icon: UserCog, label: "Team" },
  { icon: SlidersHorizontal, label: "Settings" },
]

const STATS: { label: string; value: number; tone?: Tone; className?: string }[] = [
  { label: "Overdue", value: 2, tone: "overdue" },
  { label: "Due soon", value: 3, tone: "due" },
  { label: "Needs to start", value: 1, tone: "start" },
  { label: "In production", value: 8 },
  { label: "Ready for delivery", value: 4, className: "hidden xl:flex" },
]

const ROWS = [
  { number: "RF-2026-0142", title: "Reception counter & visitor chairs", client: "Office · Lahore", days: -2, attention: "overdue", status: "in_production", owner: "IA" },
  { number: "RF-2026-0147", title: "Grade 6 classrooms", client: "School · Lahore", days: 0, attention: "due_soon", status: "in_production", owner: "SK" },
  { number: "RF-2026-0149", title: "Dining table, six seats", client: "Home · Islamabad", days: 2, attention: "due_soon", status: "ready_for_delivery", owner: "BR" },
  { number: "RF-2026-0151", title: "Executive table & side rack", client: "Office · Karachi", days: 9, attention: "needs_to_start", status: "new", owner: "IA" },
] as const

/**
 * Static, illustrative picture of the portal for the landing page hero (not live data).
 * Mirrors the real shell: Ink sidebar, dashboard counts, the attention list and balances.
 */
export function ProductPreview() {
  return (
    <figure className="relative">
      <figcaption className="sr-only">
        Illustration of the Regal order portal dashboard: counts of overdue and due-soon orders, and the orders that need attention.
      </figcaption>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-black/[0.08] bg-paper shadow-[0_1px_2px_rgb(28_25_23/0.05),0_32px_64px_-24px_rgb(28_25_23/0.28)] select-none sm:rounded-2xl"
      >
        <div className="flex h-10 items-center gap-1.5 border-b border-line bg-canvas px-4">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="mx-auto hidden h-6 w-72 items-center justify-center rounded-md border border-line bg-paper text-[0.6875rem] text-stone sm:flex">
            Regal · Order portal
          </span>
          <span className="hidden w-[2.875rem] sm:block" />
        </div>

        <div className="flex">
          <aside className="hidden w-[13.5rem] shrink-0 flex-col bg-ink text-sidebar-foreground md:flex">
            <div className="flex h-[4.25rem] items-center border-b border-sidebar-border px-5">
              <Wordmark tone="light" className="origin-left scale-[0.82]" />
            </div>
            <div className="px-3.5 pt-4">
              <span className="flex h-9 items-center justify-center gap-2 rounded-md bg-regal text-[0.8125rem] font-semibold text-white">
                <Plus className="size-4" /> New order
              </span>
            </div>
            <ul className="flex flex-1 flex-col gap-0.5 px-3.5 py-4">
              {NAV.map(({ icon: Icon, label, active }) => (
                <li
                  key={label}
                  className={
                    active
                      ? "flex h-9 items-center gap-2.5 rounded-md bg-sidebar-accent px-2.5 text-[0.8125rem] font-medium text-white"
                      : "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[0.8125rem] font-medium text-sidebar-foreground/70"
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2.5 border-t border-sidebar-border px-5 py-4">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-walnut text-[0.6875rem] font-bold text-bone">
                OA
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.75rem] font-semibold text-white">Office admin</span>
                <span className="block text-[0.6875rem] text-sidebar-muted">Admin</span>
              </span>
              <LogOut className="size-3.5 text-sidebar-muted" />
            </div>
          </aside>

          <div className="min-w-0 flex-1 bg-canvas p-4 sm:p-6 lg:p-7">
            <p className="text-[1.25rem] leading-tight font-semibold tracking-tight text-ink sm:text-[1.375rem]">Dashboard</p>
            <p className="mt-1 text-[0.75rem] text-stone">Thursday 08 Oct</p>
            <p className="mt-4 text-[0.8125rem] text-ink">
              2 orders are overdue, 3 are due within 3 days and 1 hasn&apos;t been started yet.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 xl:grid-cols-5">
              {STATS.map((s) => (
                <div key={s.label} className={`flex-col rounded-lg border border-line bg-paper p-3 sm:p-3.5 ${s.className ?? "flex"}`}>
                  <span className="truncate text-[0.6875rem] font-medium text-stone sm:text-[0.75rem]">{s.label}</span>
                  <span
                    className="mt-3 text-[1.5rem] leading-none font-semibold tracking-tight text-ink tabular sm:text-[1.75rem]"
                    style={s.tone ? { color: `var(--st-${s.tone}-fg)` } : undefined}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
              <div className="overflow-hidden rounded-lg border border-line bg-paper">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-[0.8125rem] font-semibold text-ink">Needs attention</p>
                  <p className="text-[0.6875rem] font-medium text-stone">View all orders</p>
                </div>
                <ul className="divide-y divide-line">
                  {ROWS.map((row, index) => (
                    <li key={row.number} className={`items-center gap-3 px-4 py-2.5 ${index === 3 ? "hidden sm:flex" : "flex"}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.75rem] font-semibold text-ink sm:text-[0.8125rem]">{row.title}</span>
                        <span className="block truncate text-[0.6875rem] text-stone">
                          <span className="tabular">{row.number}</span>
                          <span className="hidden sm:inline"> · {row.client}</span>
                        </span>
                      </span>
                      <DaysLeftBadge size="sm" daysLeft={row.days} attention={row.attention} status={row.status} />
                      <span className="hidden w-[8.5rem] justify-end xl:flex">
                        <StatusBadge status={row.status} size="sm" />
                      </span>
                      <span className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-walnut text-[0.5625rem] font-bold text-bone sm:inline-flex">
                        {row.owner}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden self-start rounded-lg border border-line bg-paper p-4 lg:block">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.75rem] font-medium text-stone">Outstanding balance</p>
                  <Wallet className="size-3.5 text-stone/70" />
                </div>
                <p className="mt-3 text-[1.375rem] leading-none font-semibold tracking-tight text-ink tabular">Rs 1,245,000</p>
                <p className="mt-2 text-[0.6875rem] leading-relaxed text-stone">
                  To collect on 9 orders, including delivered orders not yet paid in full.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
