import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  /** Builds the href for a page, keeping the current filters. */
  hrefFor: (page: number) => string
  noun?: [singular: string, plural: string]
}

export function Pagination({ page, pageSize, total, hrefFor, noun = ["result", "results"] }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
      <p className="text-sm text-stone tabular">
        Showing <span className="font-semibold text-ink">{from}–{to}</span> of{" "}
        <span className="font-semibold text-ink">{total}</span> {total === 1 ? noun[0] : noun[1]}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <PageLink href={page > 1 ? hrefFor(page - 1) : null} label="Previous page">
            <ChevronLeft aria-hidden="true" className="size-4" /> Previous
          </PageLink>
          <span className="px-2 text-sm text-stone tabular">
            Page {page} of {pages}
          </span>
          <PageLink href={page < pages ? hrefFor(page + 1) : null} label="Next page">
            Next <ChevronRight aria-hidden="true" className="size-4" />
          </PageLink>
        </div>
      )}
    </nav>
  )
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const classes = "inline-flex h-11 items-center gap-1 rounded-md border border-line-strong bg-paper px-4 text-sm font-semibold"
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(classes, "pointer-events-none opacity-40")}>
        {children}
      </span>
    )
  }
  return (
    <Link href={href} aria-label={label} className={cn(classes, "text-ink hover:bg-subtle")}>
      {children}
    </Link>
  )
}
