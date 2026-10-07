import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { PageHeader } from "@/components/shell/page-header"
import { AdminOnly } from "@/components/shell/admin-only"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/data/empty-state"
import { Pagination } from "@/components/data/pagination"
import { listClients } from "@/features/clients/queries"
import { NewClientDialog } from "@/features/clients/components/client-dialogs"
import { ClientSearch } from "@/features/clients/components/client-search"

export const metadata: Metadata = { title: "Clients" }

export default function ClientsPage(props: PageProps<"/clients">) {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Homes, schools and offices we make furniture for."
        actions={
          <AdminOnly>
            <NewClientDialog />
          </AdminOnly>
        }
      />
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function ClientsContent({ searchParams }: { searchParams: PageProps<"/clients">["searchParams"] }) {
  await requireUser()
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : ""
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1)
  const { rows, total, pageSize } = await listClients({ q, page })

  const hrefFor = (p: number) => {
    const next = new URLSearchParams()
    if (q) next.set("q", q)
    if (p > 1) next.set("page", String(p))
    const query = next.toString()
    return query ? `/clients?${query}` : "/clients"
  }

  return (
    <div className="flex flex-col gap-5">
      <ClientSearch />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={q ? "No clients match" : "No clients yet"}
            description={q ? "Check the spelling, or search by phone number instead." : "Clients are added here or straight from the new order form."}
          />
        </Card>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="group flex h-full items-center gap-4 rounded-xl border border-line bg-card p-4 shadow-(--shadow-card) transition-[border-color,box-shadow] hover:border-line-strong"
                >
                  <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle font-heading text-[1rem] font-semibold text-walnut">
                    {c.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{c.name}</span>
                    <span className="block truncate text-caption text-stone">
                      {[c.phone, c.company, c.city].filter(Boolean).join(" · ") || "No contact details"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-ink tabular">{c.order_count}</span>
                    <span className="block text-caption text-stone">{c.order_count === 1 ? "order" : "orders"}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-stone transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={pageSize} total={total} hrefFor={hrefFor} noun={["client", "clients"]} />
        </>
      )}
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading clients">
      <Skeleton className="h-11" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-[4.75rem]" />
        ))}
      </div>
    </div>
  )
}
