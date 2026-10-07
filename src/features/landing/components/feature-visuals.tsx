import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { ItemStatusBadge, StatusBadge } from "@/components/data/status-badge"

/** Static product fragments for the landing page (illustrative, not live data). */

/** Warm brand surface that holds a product fragment. */
export function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative overflow-hidden rounded-2xl bg-bone p-5 select-none sm:p-10", className)}>
      {children}
    </div>
  )
}

/** A quiet application window: neutral title bar, white body. */
export function AppWindow({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-paper shadow-(--shadow-raised)", className)}>
      <div className="flex h-9 items-center gap-1.5 border-b border-line bg-canvas px-3.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-2.5 truncate text-[0.6875rem] font-medium text-stone">{title}</span>
      </div>
      {children}
    </div>
  )
}

const ORDER = { number: "RF-2026-0147", title: "Grade 6 classrooms" }
const ITEMS = [
  { name: "Student desk (double)", qty: 20, status: "ready" as const },
  { name: "Student chair", qty: 40, status: "in_production" as const },
  { name: "Teacher table", qty: 2, status: "pending" as const },
]

function OrderHeading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-[0.6875rem] text-stone tabular">{ORDER.number}</p>
        <p className="truncate text-sm font-semibold text-ink">{ORDER.title}</p>
      </div>
      <StatusBadge status="in_production" size="sm" />
    </div>
  )
}

function ItemProgress({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[0.6875rem]">
        <span className="font-semibold text-ink">1 of 3 items ready</span>
        <span className="text-stone">Due today</span>
      </div>
      <Progress tone="done" value={33} className="mt-2" />
    </div>
  )
}

// ---------------------------------------------------------------------------

export function RemindersVisual() {
  const rules = [
    { title: "Due soon", value: 3, unit: "days before the deadline" },
    { title: "Needs to start", value: 10, unit: "days before the deadline" },
    { title: "Not-started grace period", value: 2, unit: "days after the order" },
  ]
  return (
    <Stage>
      <AppWindow title="Settings · Reminders">
        <ul className="divide-y divide-line">
          {rules.map((rule) => (
            <li key={rule.title} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold text-ink">{rule.title}</p>
                <p className="mt-0.5 text-[0.6875rem] text-stone">{rule.unit}</p>
              </div>
              <span className="inline-flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-field-border text-sm font-semibold text-ink tabular">
                {rule.value}
              </span>
            </li>
          ))}
        </ul>
      </AppWindow>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        <DaysLeftBadge daysLeft={-2} attention="overdue" status="in_production" />
        <DaysLeftBadge daysLeft={0} attention="due_soon" status="in_production" />
        <DaysLeftBadge daysLeft={9} attention="needs_to_start" status="new" />
        <DaysLeftBadge daysLeft={24} attention="on_track" status="in_production" />
      </div>
    </Stage>
  )
}

export function FactoryVisual() {
  return (
    <Stage className="flex justify-center">
      <div className="w-full max-w-[19rem] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-paper shadow-(--shadow-raised)">
        <div className="relative">
          <div className="border-b border-line px-4 pt-4 pb-3">
            <OrderHeading />
          </div>
          <ItemProgress className="px-4 pt-3" />
          <ul className="mt-1 divide-y divide-line border-b border-line">
            {ITEMS.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[0.8125rem] font-medium text-ink">{item.name}</span>
                  <span className="text-[0.6875rem] text-stone tabular">× {item.qty}</span>
                </span>
                <ItemStatusBadge status={item.status} />
              </li>
            ))}
          </ul>
          <div className="h-[4.75rem]" />
          {/* The confirmation that follows a status change, with Undo for a mistaken tap. */}
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5 shadow-(--shadow-raised)">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--st-done-bg)]">
              <Check className="size-3 text-[var(--st-done-fg)]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.75rem] font-semibold text-ink">Status: In production</span>
              <span className="block text-[0.6875rem] text-stone tabular">{ORDER.number}</span>
            </span>
            <span className="rounded-md bg-ink px-2.5 py-1 text-[0.6875rem] font-semibold text-white">Undo</span>
          </div>
        </div>
      </div>
    </Stage>
  )
}

export function SharingVisual() {
  return (
    <Stage>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start sm:gap-5">
        <div className="rounded-md border border-line bg-paper p-4 shadow-(--shadow-raised) sm:p-5">
          <div className="flex items-end justify-between border-b-2 border-ink pb-2">
            <span className="leading-none">
              <span className="block text-[0.8125rem] font-extrabold tracking-[0.16em] text-ink">REGAL</span>
              <span className="mt-1 block text-[0.375rem] font-semibold tracking-[0.6em] text-ink">FURNITURES</span>
            </span>
            <span className="text-right">
              <span className="block text-[0.625rem] text-stone">Job sheet</span>
              <span className="block text-[0.75rem] font-semibold text-ink tabular">{ORDER.number}</span>
            </span>
          </div>
          <div className="mt-2.5 flex justify-between text-[0.625rem] text-stone">
            <span>{ORDER.title}</span>
            <span>Deadline 08 Oct</span>
          </div>
          <div className="mt-2.5 border border-ink text-[0.6875rem]">
            <div className="flex border-b border-ink bg-subtle font-semibold">
              <span className="w-5 shrink-0 border-r border-ink py-1 text-center">#</span>
              <span className="flex-1 px-1.5 py-1">Item</span>
              <span className="w-8 shrink-0 border-l border-ink py-1 text-center">Qty</span>
            </div>
            {ITEMS.map((item, index) => (
              <div key={item.name} className="flex border-b border-ink last:border-b-0">
                <span className="w-5 shrink-0 border-r border-ink py-1 text-center font-semibold tabular">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate px-1.5 py-1 font-medium">{item.name}</span>
                <span className="w-8 shrink-0 border-l border-ink py-1 text-center font-semibold tabular">{item.qty}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.625rem] text-stone">Factory copy · no prices</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-(--shadow-raised)">
          <div className="border-b border-line px-3.5 py-2.5">
            <p className="text-[0.75rem] font-semibold text-ink">Factory team</p>
            <p className="text-[0.625rem] text-stone">WhatsApp</p>
          </div>
          <div className="bg-canvas p-3">
            <div className="rounded-lg rounded-tr-sm border border-[#cfe9c6] bg-[#e9f7e3] p-3 text-[0.6875rem] leading-relaxed text-ink">
              <p className="font-semibold">
                {ORDER.number} — {ORDER.title}
              </p>
              <p className="mt-1">Deadline: 08 Oct (due today)</p>
              <p className="mt-1">1. Student desk (double) × 20</p>
              <p>2. Student chair × 40</p>
              <p>3. Teacher table × 2</p>
              <p className="mt-1.5 font-medium text-[#1d5fa8]">Open in portal</p>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  )
}

// --- Roles: the same order, as each role sees it -------------------------------

const MONEY = [
  { label: "Order amount", value: "Rs 450,000" },
  { label: "Delivery charges", value: "Rs 5,000" },
  { label: "Received", value: "Rs 200,000" },
]

export function OfficeViewVisual() {
  return (
    <AppWindow title="Order · Office view">
      <div className="p-5">
        <OrderHeading />
        <dl className="mt-4 divide-y divide-line rounded-lg border border-line text-[0.75rem]">
          {MONEY.map((row) => (
            <div key={row.label} className="flex justify-between px-3.5 py-2.5">
              <dt className="text-stone">{row.label}</dt>
              <dd className="font-medium text-ink tabular">{row.value}</dd>
            </div>
          ))}
          <div className="flex justify-between bg-subtle/60 px-3.5 py-2.5">
            <dt className="font-semibold text-ink">Remaining</dt>
            <dd className="font-semibold text-ink tabular">Rs 255,000</dd>
          </div>
        </dl>
      </div>
    </AppWindow>
  )
}

export function FactoryViewVisual() {
  return (
    <AppWindow title="Order · Factory view">
      <div className="p-5">
        <OrderHeading />
        <ItemProgress className="mt-4" />
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {ITEMS.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 px-3.5 py-2">
              <span className="truncate text-[0.75rem] font-medium text-ink">
                {item.name} <span className="font-normal text-stone tabular">× {item.qty}</span>
              </span>
              <ItemStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      </div>
    </AppWindow>
  )
}
