import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { ClipboardList, Plus, SearchX } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { PageHeader } from "@/components/shell/page-header"
import { AdminOnly } from "@/components/shell/admin-only"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/data/empty-state"
import { Pagination } from "@/components/data/pagination"
import { listActiveTeam, listOrders } from "@/features/orders/queries"
import { ORDER_SORTS, parseOrderFilters, type OrderFilters as Filters } from "@/features/orders/schema"
import { OrderFilters } from "@/features/orders/components/order-filters"
import { OrderList } from "@/features/orders/components/order-list"
import { OrdersSkeleton } from "@/features/orders/components/orders-skeleton"
import { PRODUCTION_STATUS_LABEL } from "@/lib/domain/status"

export const metadata: Metadata = { title: "Orders" }

export default function OrdersPage(props: PageProps<"/orders">) {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order in one place, nearest deadline first."
        actions={
          <AdminOnly>
            <Button asChild>
              <Link href="/orders/new">
                <Plus aria-hidden="true" /> New order
              </Link>
            </Button>
          </AdminOnly>
        }
      />
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function OrdersContent({ searchParams }: { searchParams: PageProps<"/orders">["searchParams"] }) {
  const user = await requireUser()
  const raw = await searchParams
  const filters = parseOrderFilters(raw)
  const [team, { rows, total, pageSize, balances }] = await Promise.all([listActiveTeam(), listOrders(filters, { isAdmin: user.isAdmin })])
  const page = filters.page ?? 1
  const hasFilters = Boolean(filters.q || filters.status || filters.attention || filters.responsible || filters.from || filters.to || filters.archived || filters.delivered)

  const hrefFor = (p: number) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(raw)) if (typeof value === "string" && value && key !== "page") next.set(key, value)
    if (p > 1) next.set("page", String(p))
    const query = next.toString()
    return query ? `/orders?${query}` : "/orders"
  }

  return (
    <div className="flex flex-col gap-5">
      <OrderFilters team={team} isAdmin={user.isAdmin} />
      <p className="text-sm text-stone" aria-live="polite">
        <span className="font-semibold text-ink tabular">{total}</span> {describeView(filters, total)}
        {filters.sort && filters.sort !== "deadline" ? ` · ${ORDER_SORTS[filters.sort].toLowerCase()}` : " · nearest deadline first"}
      </p>

      {rows.length === 0 ? (
        <Card>
          {total > 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing on this page"
              description={`There are ${total} matching orders, but this page number is past the end of the list.`}
              action={
                <Button asChild variant="outline">
                  <Link href={hrefFor(1)}>Go to the first page</Link>
                </Button>
              }
            />
          ) : hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No orders match"
              description={
                filters.q && !filters.status
                  ? "Only open orders were searched. Try searching all orders, or clear the filters."
                  : "Try a different search or remove a filter."
              }
              action={
                <>
                  {filters.q && !filters.status && (
                    <Button asChild variant="outline">
                      <Link href={`/orders?status=all&q=${encodeURIComponent(filters.q)}`}>Search all orders</Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost">
                    <Link href="/orders">Clear filters</Link>
                  </Button>
                </>
              }
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No open orders"
              description={user.isAdmin ? "When you add an order it appears here, nearest deadline first." : "New orders will appear here as soon as the office adds them."}
              action={
                user.isAdmin ? (
                  <Button asChild>
                    <Link href="/orders/new">
                      <Plus aria-hidden="true" /> New order
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          )}
        </Card>
      ) : (
        <>
          <OrderList rows={rows} isAdmin={user.isAdmin} balances={balances} />
          <Pagination page={page} pageSize={pageSize} total={total} hrefFor={hrefFor} noun={["order", "orders"]} />
        </>
      )}
    </div>
  )
}

function describeView(filters: Filters, total: number) {
  const one = total === 1
  const noun = one ? "order" : "orders"
  if (filters.delivered === "this-month") return `${noun} delivered this month`
  if (filters.attention) {
    return {
      overdue: `overdue ${noun}`,
      due_soon: `${noun} due soon`,
      needs_to_start: one ? "order that needs to start" : "orders that need to start",
      on_track: `${noun} on track`,
    }[filters.attention]
  }
  if (!filters.status) return `open ${noun}`
  if (filters.status === "all") return noun
  return `${noun} · ${PRODUCTION_STATUS_LABEL[filters.status].toLowerCase()}`
}
