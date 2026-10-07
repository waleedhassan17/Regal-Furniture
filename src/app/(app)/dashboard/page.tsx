import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { AlarmClock, ArrowRight, CalendarClock, CheckCheck, Hammer, Hourglass, PackageCheck, Truck, Wallet } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { formatDate } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"
import { formatMoney } from "@/lib/format/money"
import { greeting, longToday } from "@/lib/format/greeting"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HexStatCard } from "@/components/data/hex-stat-card"
import { EmptyState } from "@/components/data/empty-state"
import { getDashboardSummary, getNeedsAttention, getNextDeadline, NEEDS_ATTENTION_LIMIT } from "@/features/dashboard/queries"
import { summarySentence } from "@/features/dashboard/summary-sentence"
import { AttentionList } from "@/features/dashboard/components/attention-list"
import { getSettings } from "@/features/settings/queries"

export const metadata: Metadata = { title: "Dashboard" }

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}

async function Dashboard() {
  const user = await requireUser()
  const [summary, attention, settings, next] = await Promise.all([getDashboardSummary(), getNeedsAttention(), getSettings(), getNextDeadline()])
  const needsAttention = summary.overdue + summary.dueSoon + summary.needsToStart
  const firstName = user.fullName.split(/\s+/)[0]
  const dueWindow = settings.dueSoonDays === 0 ? "Due today" : `Within ${settings.dueSoonDays} ${settings.dueSoonDays === 1 ? "day" : "days"}`

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="eyebrow text-regal">Today · {longToday()}</p>
        <h1 className="mt-2 font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-[1rem] leading-relaxed text-ink">{summarySentence(summary, settings.dueSoonDays)}</p>
      </header>

      <section aria-label="Order counts" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <HexStatCard label="Overdue" value={summary.overdue} href="/orders?attention=overdue" icon={AlarmClock} tone="overdue" urgent hint="Deadline has passed" />
        <HexStatCard label="Due soon" value={summary.dueSoon} href="/orders?attention=due_soon" icon={CalendarClock} tone="due" urgent hint={dueWindow} />
        <HexStatCard label="Needs to start" value={summary.needsToStart} href="/orders?attention=needs_to_start" icon={Hourglass} tone="start" urgent hint="Still marked New" />
        <HexStatCard label="In production" value={summary.inProduction} href="/orders?status=in_production" icon={Hammer} tone="progress" />
        <HexStatCard label="Ready for delivery" value={summary.readyForDelivery} href="/orders?status=ready_for_delivery" icon={Truck} tone="ready" />
        <HexStatCard label="Delivered this month" value={summary.deliveredThisMonth} href="/orders?status=delivered&delivered=this-month" icon={PackageCheck} tone="done" />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="attention-heading" className="overflow-hidden rounded-xl border border-sand bg-card shadow-(--shadow-card)">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-5 py-4 sm:px-6">
            <div>
              <h2 id="attention-heading" className="font-heading text-[1.25rem] leading-tight font-semibold tracking-tight text-ink">
                Needs attention
              </h2>
              <p className="mt-0.5 text-sm text-stone">Most urgent first</p>
            </div>
            {needsAttention > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/orders?sort=urgency">
                  {needsAttention > NEEDS_ATTENTION_LIMIT ? `View all ${needsAttention}` : "Open orders list"} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
          {attention.length > 0 ? (
            <AttentionList rows={attention} />
          ) : (
            <EmptyState
              icon={CheckCheck}
              tone="positive"
              title="All clear"
              description={
                next ? (
                  <>
                    Nothing is late or waiting to start. {summary.onTrack} open {summary.onTrack === 1 ? "order is" : "orders are"} on track — the next
                    deadline is <strong className="font-semibold text-ink">{next.client_name}</strong> on {formatDate(next.delivery_deadline)} (
                    {formatDaysLeft(next.days_left ?? 0).toLowerCase()}).
                  </>
                ) : (
                  "There are no open orders right now. New orders will show up here when they need someone."
                )
              }
              action={
                <Button asChild variant="outline">
                  <Link href="/orders">See all open orders</Link>
                </Button>
              }
            />
          )}
        </section>

        {user.isAdmin && summary.outstandingBalance !== null && (
          <aside aria-labelledby="outstanding-heading" className="flex flex-col justify-between gap-6 self-start rounded-xl bg-ink p-6 text-bone shadow-(--shadow-raised)">
            <div className="flex items-center justify-between">
              <h2 id="outstanding-heading" className="eyebrow text-sidebar-muted">
                Outstanding balance
              </h2>
              <Wallet aria-hidden="true" className="size-5 text-sidebar-muted" />
            </div>
            <div>
              <p className="font-display text-[2rem] leading-none font-semibold tracking-tight text-white tabular">{formatMoney(summary.outstandingBalance)}</p>
              <p className="mt-2 text-sm text-sidebar-foreground">
                Still to collect on {summary.ordersWithBalance ?? 0} {summary.ordersWithBalance === 1 ? "order" : "orders"}, including delivered orders not yet
                paid in full.
              </p>
            </div>
            <p className="text-caption text-sidebar-muted">Only admins can see this.</p>
          </aside>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[9.5rem] rounded-xl" />
        ))}
      </div>
      <Card className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </Card>
    </div>
  )
}
