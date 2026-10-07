import Link from "next/link"
import { UserRound } from "lucide-react"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { formatDate } from "@/lib/format/date"
import { formatItemSummary } from "@/lib/format/items"
import { StatusControl } from "@/features/orders/components/status-control"
import type { OrderListRow } from "@/features/orders/queries"

/** Most urgent first: who, what, how long is left, current status, and who is responsible. */
export function AttentionList({ rows }: { rows: OrderListRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => (
        <li key={row.id} className="relative flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-subtle/50 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/orders/${row.id}`}
                className="truncate font-bold text-ink after:absolute after:inset-0 after:content-[''] hover:text-regal focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-ink"
              >
                {row.client_name}
              </Link>
              <span className="shrink-0 text-caption text-stone tabular">{row.order_number}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink">{formatItemSummary(row.item_preview, row.item_count)}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-caption text-stone">
              <span>Due {formatDate(row.delivery_deadline)}</span>
              <span className="inline-flex items-center gap-1">
                <UserRound aria-hidden="true" className="size-3" />
                {row.responsible_name ?? "Not assigned"}
              </span>
            </p>
          </div>
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2">
            <DaysLeftBadge daysLeft={row.days_left} attention={row.attention_level} status={row.status} size="sm" />
            <StatusControl orderId={row.id} orderNumber={row.order_number} status={row.status} size="sm" />
          </div>
        </li>
      ))}
    </ul>
  )
}
