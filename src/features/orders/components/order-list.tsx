import Link from "next/link"
import { ChevronRight, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { formatDate } from "@/lib/format/date"
import { formatItemSummary } from "@/lib/format/items"
import { formatMoney } from "@/lib/format/money"
import { StatusControl } from "@/features/orders/components/status-control"
import type { OrderListRow } from "@/features/orders/queries"

type OrderListProps = {
  rows: OrderListRow[]
  isAdmin: boolean
  balances: Map<string, number | null>
}

/** Orders as a table on desktop and as cards on phones. Status can be changed from either. */
export function OrderList({ rows, isAdmin, balances }: OrderListProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-line bg-card shadow-(--shadow-card) lg:block">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[24%]" />
            <col />
            <col className="w-36" />
            <col className="w-44" />
            <col className="w-32" />
            {isAdmin && <col className="w-28" />}
            <col className="w-9" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client & order</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsible</TableHead>
              {isAdmin && <TableHead className="text-right">Balance</TableHead>}
              <TableHead>
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn("relative", row.is_archived && "opacity-70")}>
                <TableCell className="align-top">
                  <Link
                    href={`/orders/${row.id}`}
                    className="block truncate font-bold text-ink after:absolute after:inset-0 after:content-[''] hover:text-regal focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-ink"
                    title={row.client_name}
                  >
                    {row.client_name}
                  </Link>
                  <p className="mt-0.5 truncate text-caption text-stone tabular">
                    <span className="font-semibold text-ink/80">{row.order_number}</span>
                    {row.bill_number ? ` · Bill ${row.bill_number}` : ""}
                  </p>
                </TableCell>
                <TableCell className="align-top">
                  <p className="line-clamp-2 text-sm text-ink">{formatItemSummary(row.item_preview, row.item_count)}</p>
                  <p className="mt-0.5 text-caption text-stone tabular">
                    {row.ready_count}/{row.item_count} ready
                  </p>
                </TableCell>
                <TableCell className="align-top whitespace-nowrap">
                  <p className="text-sm font-semibold text-ink tabular">{formatDate(row.delivery_deadline)}</p>
                  <DaysLeftBadge
                    className="mt-1"
                    size="sm"
                    daysLeft={row.days_left}
                    attention={row.attention_level}
                    status={row.status}
                    isArchived={row.is_archived}
                  />
                </TableCell>
                <TableCell className="relative z-10 align-top">
                  <StatusControl orderId={row.id} orderNumber={row.order_number} status={row.status} disabled={row.is_archived} size="sm" />
                </TableCell>
                <TableCell className="align-top text-sm">
                  {row.responsible_name ? (
                    <span className="block truncate text-ink" title={row.responsible_name}>
                      {row.responsible_name}
                    </span>
                  ) : (
                    <span className="text-stone">—</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right align-top text-sm font-semibold whitespace-nowrap">
                    <Balance value={balances.get(row.id)} />
                  </TableCell>
                )}
                <TableCell className="px-2 align-top">
                  <ChevronRight aria-hidden="true" className="mt-0.5 size-4 text-stone" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <article className={cn("relative rounded-xl border border-line bg-card p-4 shadow-(--shadow-card)", row.is_archived && "opacity-75")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[0.9375rem] font-bold text-ink">
                    <Link href={`/orders/${row.id}`} className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ink">
                      {row.client_name}
                    </Link>
                  </h3>
                  <p className="mt-0.5 text-caption text-stone tabular">
                    {row.order_number}
                    {row.bill_number ? ` · Bill ${row.bill_number}` : ""} · Due {formatDate(row.delivery_deadline)}
                  </p>
                </div>
                <DaysLeftBadge size="sm" daysLeft={row.days_left} attention={row.attention_level} status={row.status} isArchived={row.is_archived} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink">{formatItemSummary(row.item_preview, row.item_count)}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="relative z-10">
                  <StatusControl orderId={row.id} orderNumber={row.order_number} status={row.status} disabled={row.is_archived} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-caption text-stone">
                  {row.responsible_name && (
                    <span className="inline-flex items-center gap-1">
                      <UserRound aria-hidden="true" className="size-3.5" /> {row.responsible_name}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="font-semibold text-ink">
                      <Balance value={balances.get(row.id)} />
                    </span>
                  )}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}

function Balance({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="font-medium text-stone">Not set</span>
  if (value <= 0) return <span className="text-[var(--st-done-fg)]">{value < 0 ? `Overpaid ${formatMoney(-value)}` : "Paid"}</span>
  return <span className="tabular">{formatMoney(value)}</span>
}
