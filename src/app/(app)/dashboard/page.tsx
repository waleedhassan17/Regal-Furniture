import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { AlarmClock, ArrowRight, CalendarClock, CheckCheck, Hammer, Hourglass, PackageCheck, Truck, Wallet } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { formatDate, longToday } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"
import { formatMoney } from "@/lib/format/money"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/data/stat-card"
import { PageHeader } from "@/components/shell/page-header"
import { EmptyState } from "@/components/data/empty-state"
import { getDashboardSummary, getNeedsAttention, getNextDeadline } from "@/features/dashboard/queries"
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
  const dueWindow = settings.dueSoonDays === 0 ? "Due today" : `Within ${settings.dueSoonDays} ${settings.dueSoonDays === 1 ? "day" : "days"}`

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="mb-0 sm:mb-0"
        title="Dashboard"
        description={summarySentence(summary, settings.dueSoonDays)}
        actions={<p className="text-sm text-stone">{longToday()}</p>}
      />

      <section aria-label="Order counts" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Overdue" value={summary.overdue} href="/orders?attention=overdue" icon={AlarmClock} tone="overdue" hint="Deadline has passed" />
        <StatCard label="Due soon" value={summary.dueSoon} href="/orders?attention=due_soon" icon={CalendarClock} tone="due" hint={dueWindow} />
        <StatCard label="Needs to start" value={summary.needsToStart} href="/orders?attention=needs_to_start" icon={Hourglass} tone="start" hint="Still marked New" />
        <StatCard label="In production" value={summary.inProduction} href="/orders?status=in_production" icon={Hammer} />
        <StatCard label="Ready for delivery" value={summary.readyForDelivery} href="/orders?status=ready_for_delivery" icon={Truck} />
        <StatCard label="Delivered this month" value={summary.deliveredThisMonth} href="/orders?status=delivered&delivered=this-month" icon={PackageCheck} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="attention-heading" className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <h2 id="attention-heading" className="text-[1.0625rem] font-semibold tracking-tight text-ink">
              Needs attention
              {needsAttention > 0 && <span className="ml-2 font-medium text-stone tabular">{needsAttention}</span>}
            </h2>
            {needsAttention > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/orders?sort=urgency">
                  View all <ArrowRight aria-hidden="true" />
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
              title="Nothing needs attention"
              description={
                next ? (
                  <>
                    No order is late or waiting to start. The next deadline is <strong className="font-semibold text-ink">{next.client_name}</strong> on{" "}
                    {formatDate(next.delivery_deadline)} ({formatDaysLeft(next.days_left ?? 0).toLowerCase()}).
                  </>
                ) : (
                  "There are no open orders right now."
                )
              }
              action={
                <Button asChild variant="outline">
                  <Link href="/orders">Open orders</Link>
                </Button>
              }
            />
          )}
        </section>

        {user.isAdmin && summary.outstandingBalance !== null && (
          <aside aria-labelledby="outstanding-heading" className="self-start rounded-xl border border-line bg-paper p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="outstanding-heading" className="text-sm font-medium text-stone">
                Outstanding balance
              </h2>
              <Wallet aria-hidden="true" className="size-4 text-stone/70" />
            </div>
            <p className="mt-4 text-[1.75rem] leading-none font-semibold tracking-tight text-ink tabular">{formatMoney(summary.outstandingBalance)}</p>
            <p className="mt-2 text-caption leading-relaxed text-stone">
              To collect on {summary.ordersWithBalance ?? 0} {summary.ordersWithBalance === 1 ? "order" : "orders"}, including delivered orders not yet paid in full.
            </p>
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
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[8.5rem] rounded-xl" />
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
