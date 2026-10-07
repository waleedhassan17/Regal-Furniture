import type { Metadata } from "next"
import { AlarmClock, CalendarClock, CheckCheck, Hammer, Hourglass, Inbox, PackageCheck, Plus, Truck } from "lucide-react"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/ui/field"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HexFrame } from "@/components/brand/hexagon"
import { Lockup, Mark, Wordmark } from "@/components/brand/logo"
import { HexStatCard } from "@/components/data/hex-stat-card"
import { EmptyState } from "@/components/data/empty-state"
import { StatusBadge, ItemStatusBadge, AttentionBadge } from "@/components/data/status-badge"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { PRODUCTION_STATUSES, ITEM_STATUSES, ATTENTION_LEVELS } from "@/lib/domain/status"
import { formatMoney } from "@/lib/format/money"
import { formatDate } from "@/lib/format/date"
import { ToastDemo } from "./toast-demo"

export const metadata: Metadata = { title: "Style guide" }

const SWATCHES = [
  { name: "Bone", token: "--bone", hex: "#F5F1EA", note: "Page background · leads (40%)" },
  { name: "Ink", token: "--ink", hex: "#231F20", note: "Text, sidebar · anchors" },
  { name: "Regal Red", token: "--regal", hex: "#C42126", note: "Primary actions, urgent states" },
  { name: "Crimson Depth", token: "--crimson", hex: "#8E1620", note: "Hover / pressed" },
  { name: "Sand", token: "--sand", hex: "#E8E0D2", note: "Borders, subtle fills" },
  { name: "Walnut", token: "--walnut", hex: "#5A3A24", note: "Warm accent" },
  { name: "Charcoal", token: "--charcoal", hex: "#2A2A2D", note: "Secondary dark surfaces" },
  { name: "Paper", token: "--paper", hex: "#FFFDF9", note: "Card surface on Bone" },
]

export default function StyleguidePage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Temporary · Phase 1"
        title="Style guide"
        description="Every shared building block of the portal, drawn from the Regal brand guidelines. This page is removed before release."
      />

      <Section title="Brand" description="Supplied logo files are used when present in public/brand; otherwise a plain text wordmark.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex h-32 items-center justify-center rounded-xl border border-sand bg-paper"><Lockup /></div>
          <div className="flex h-32 items-center justify-center rounded-xl bg-ink"><Wordmark tone="light" /></div>
          <div className="flex h-32 items-center justify-center gap-4 rounded-xl border border-sand bg-paper">
            <Mark size={48} />
            <HexFrame size={56} stroke="var(--regal)"><Hammer className="size-5 text-regal" aria-hidden="true" /></HexFrame>
          </div>
        </div>
      </Section>

      <Section title="Colour" description="Bone leads. Ink anchors. Crimson is the moment of conviction — used for emphasis, never for noise.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.name} className="overflow-hidden rounded-xl border border-sand bg-paper">
              <div className="h-20" style={{ backgroundColor: `var(${s.token})` }} />
              <div className="p-3">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-caption text-stone tabular">{s.hex}</p>
                <p className="mt-1 text-caption text-stone">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" description="Playfair Display for titles and big figures; Montserrat for everything else.">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="font-display text-[2.5rem] leading-none font-bold sm:text-display">Furniture, faithfully made.</p>
            <p className="font-heading text-h1 font-bold">Orders due this week</p>
            <p className="font-heading text-h2 font-semibold">Hamza Sb · Executive office</p>
            <p className="text-h3 font-bold">Items and materials</p>
            <p className="max-w-2xl text-body">
              Body copy sits in Montserrat at 15px with generous line height so long item notes stay readable on a phone in the factory.
            </p>
            <p className="eyebrow text-regal">02 · Eyebrow label</p>
            <p className="font-display text-[2.75rem] leading-none font-bold tabular">{formatMoney(1250000)}</p>
            <p className="text-sm text-stone">Dates read as {formatDate("2026-10-08")}; money as {formatMoney(125000)}.</p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Buttons" description="44px tall by default. Red only for the main action on a screen.">
        <div className="flex flex-wrap items-center gap-3">
          <Button><Plus aria-hidden="true" /> New order</Button>
          <Button variant="ink">Save changes</Button>
          <Button variant="outline">Print job sheet</Button>
          <Button variant="secondary">Duplicate</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Archive order</Button>
          <Button variant="link">View all</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" variant="outline">Small</Button>
        </div>
      </Section>

      <Section title="Form fields">
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Client name" htmlFor="sg-name"><Input id="sg-name" placeholder="e.g. Hamza Sb" /></Field>
            <Field label="Bill number" htmlFor="sg-bill" optional hint="From the paper bill book, if any.">
              <Input id="sg-bill" placeholder="B-1042" />
            </Field>
            <Field label="Delivery deadline" htmlFor="sg-dd" error="Choose a date on or after the order date.">
              <Input id="sg-dd" type="date" aria-invalid />
            </Field>
            <Field label="Special instructions" htmlFor="sg-note" optional>
              <Textarea id="sg-note" placeholder="Anything the factory must know" />
            </Field>
          </CardContent>
        </Card>
      </Section>

      <Section title="Status" description="Colour is always paired with a label.">
        <div className="flex flex-col gap-4">
          <Row label="Production status">{PRODUCTION_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}</Row>
          <Row label="Item status">{ITEM_STATUSES.map((s) => <ItemStatusBadge key={s} status={s} size="md" />)}</Row>
          <Row label="Attention">{ATTENTION_LEVELS.map((l) => <AttentionBadge key={l} level={l} />)}</Row>
          <Row label="Days left">
            <DaysLeftBadge daysLeft={-3} attention="overdue" status="in_production" />
            <DaysLeftBadge daysLeft={0} attention="due_soon" status="in_production" />
            <DaysLeftBadge daysLeft={2} attention="due_soon" status="ready_for_delivery" />
            <DaysLeftBadge daysLeft={9} attention="needs_to_start" status="new" />
            <DaysLeftBadge daysLeft={24} attention="on_track" status="in_production" />
            <DaysLeftBadge daysLeft={-4} attention={null} status="delivered" />
            <DaysLeftBadge daysLeft={6} attention={null} status="cancelled" />
          </Row>
        </div>
      </Section>

      <Section title="Dashboard cards" description="Hexagon-framed count cards link to the filtered order list.">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          <HexStatCard label="Overdue" value={3} href="#" icon={AlarmClock} tone="overdue" urgent hint="Deadline has passed" />
          <HexStatCard label="Due soon" value={5} href="#" icon={CalendarClock} tone="due" urgent hint="Within 3 days" />
          <HexStatCard label="Needs to start" value={2} href="#" icon={Hourglass} tone="start" urgent hint="Still marked New" />
          <HexStatCard label="In production" value={11} href="#" icon={Hammer} tone="progress" />
          <HexStatCard label="Ready for delivery" value={4} href="#" icon={Truck} tone="ready" />
          <HexStatCard label="Delivered this month" value={0} href="#" icon={PackageCheck} tone="done" />
        </div>
      </Section>

      <Section title="Empty states">
        <div className="grid gap-4 md:grid-cols-2">
          <Card><EmptyState icon={CheckCheck} tone="positive" title="Nothing needs attention" description="Every open order is on track. New orders will appear here as soon as they need someone." /></Card>
          <Card><EmptyState icon={Inbox} title="No orders match" description="Try a different search or clear the filters." action={<Button variant="outline">Clear filters</Button>} /></Card>
        </div>
      </Section>

      <Section title="Loading">
        <Card>
          <CardHeader><CardTitle>Skeletons</CardTitle><CardDescription>Shown while data streams in.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Toasts" description="Confirmations appear at the bottom; status changes offer Undo.">
        <ToastDemo />
      </Section>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-h2 font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="w-40 shrink-0 text-caption font-bold tracking-wide text-stone uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
