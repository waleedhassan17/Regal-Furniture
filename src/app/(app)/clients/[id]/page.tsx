import type { Metadata } from "next"
import { Suspense } from "react"
import { getClientTitle, getClient, getClientBalances, getClientOrders } from "@/features/clients/queries"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, ClipboardList, MapPin, Phone, Plus, StickyNote } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format/date"
import { formatItemSummary } from "@/lib/format/items"
import { formatMoney } from "@/lib/format/money"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/data/empty-state"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { StatusBadge } from "@/components/data/status-badge"
import { EditClientDialog } from "@/features/clients/components/client-dialogs"

export async function generateMetadata(props: PageProps<"/clients/[id]">): Promise<Metadata> {
  const { id } = await props.params
  return { title: (await getClientTitle(id)) ?? "Client" }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function ClientPage(props: PageProps<"/clients/[id]">) {
  return (
    <>
      <Link href="/clients" className="mb-4 inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-stone hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" /> All clients
      </Link>
      <Suspense fallback={<ClientSkeleton />}>
        <ClientContent params={props.params} />
      </Suspense>
    </>
  )
}

async function ClientContent({ params }: { params: PageProps<"/clients/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const [client, orders, balances] = await Promise.all([
    getClient(id),
    getClientOrders(id),
    user.isAdmin ? getClientBalances(id) : Promise.resolve(null),
  ])
  if (!client) notFound()
  const phones = [client.phone, client.alt_phone].filter((p): p is string => !!p)
  const openCount = orders.filter((o) => !o.is_archived && o.status !== "delivered" && o.status !== "cancelled").length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-regal">Client</p>
          <h1 className="mt-2 font-heading text-[1.875rem] leading-tight font-bold text-ink sm:text-h1">{client.name}</h1>
          <p className="mt-2 text-sm text-stone">
            {orders.length} {orders.length === 1 ? "order" : "orders"} · {openCount} open
          </p>
        </div>
        {user.isAdmin && (
          <div className="flex flex-wrap gap-2">
            <EditClientDialog
              client={{
                id: client.id,
                name: client.name,
                phone: client.phone ?? "",
                alt_phone: client.alt_phone ?? "",
                company: client.company ?? "",
                address: client.address ?? "",
                city: client.city ?? "",
                notes: client.notes ?? "",
              }}
            />
            <Button asChild>
              <Link href={`/orders/new?client=${client.id}`}>
                <Plus aria-hidden="true" /> New order
              </Link>
            </Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 text-sm">
              <Detail icon={Phone} label="Phone">
                {phones.length ? (
                  phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="block font-semibold text-ink underline-offset-4 hover:text-regal hover:underline">
                      {p}
                    </a>
                  ))
                ) : (
                  <span className="text-stone">No phone saved</span>
                )}
              </Detail>
              {client.company && (
                <Detail icon={Building2} label="Company">
                  {client.company}
                </Detail>
              )}
              <Detail icon={MapPin} label="Address">
                {client.address || client.city ? (
                  <span className="whitespace-pre-line">{[client.address, client.city].filter(Boolean).join("\n")}</span>
                ) : (
                  <span className="text-stone">No address saved</span>
                )}
              </Detail>
              {client.notes && (
                <Detail icon={StickyNote} label="Notes">
                  <span className="whitespace-pre-line">{client.notes}</span>
                </Detail>
              )}
            </CardContent>
          </Card>

          {balances && (
            <Card>
              <CardHeader>
                <CardTitle>Balance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm tabular">
                <div>
                  <p className="text-caption font-semibold text-stone">Outstanding</p>
                  <p className={cn("font-display text-[1.875rem] leading-tight font-bold", balances.outstanding > 0 ? "text-regal" : "text-[var(--st-done-fg)]")}>
                    {formatMoney(balances.outstanding)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-sand pt-3">
                  <div>
                    <p className="text-caption font-semibold text-stone">Total billed</p>
                    <p className="font-semibold text-ink">{formatMoney(balances.billed)}</p>
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-stone">Received</p>
                    <p className="font-semibold text-ink">{formatMoney(balances.received)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <section aria-labelledby="history-heading" className="flex flex-col gap-3">
          <h2 id="history-heading" className="text-h3 font-bold text-ink">
            Order history
          </h2>
          {orders.length === 0 ? (
            <Card>
              <EmptyState
                icon={ClipboardList}
                title="No orders yet"
                description="Orders for this client will appear here."
                action={
                  user.isAdmin ? (
                    <Button asChild>
                      <Link href={`/orders/new?client=${client.id}`}>
                        <Plus aria-hidden="true" /> New order
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {orders.map((o) => {
                const balance = balances?.byOrder.get(o.id ?? "")
                return (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.id}`}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border border-sand bg-card p-4 shadow-(--shadow-card) transition-[border-color,box-shadow] hover:border-sand-strong hover:shadow-(--shadow-raised) sm:flex-row sm:items-center",
                        o.is_archived && "opacity-70"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink tabular">
                          {o.order_number}
                          {o.bill_number && <span className="font-medium text-stone"> · Bill {o.bill_number}</span>}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-ink">{formatItemSummary(o.item_preview, o.item_count ?? 0)}</p>
                        <p className="mt-0.5 text-caption text-stone">
                          Ordered {formatDate(o.order_date)} · Due {formatDate(o.delivery_deadline)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {o.status && <StatusBadge status={o.status} size="sm" />}
                        {o.status && (
                          <DaysLeftBadge size="sm" daysLeft={o.days_left ?? 0} attention={o.attention_level} status={o.status} isArchived={o.is_archived ?? false} />
                        )}
                        {balance && balance.remaining !== null && balance.remaining > 0 && (
                          <span className="text-sm font-semibold text-ink tabular">{formatMoney(balance.remaining)} due</span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-caption font-semibold text-stone">
        <Icon aria-hidden="true" className="size-3.5" /> {label}
      </p>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  )
}

function ClientSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading client">
      <Skeleton className="h-16 w-80" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Skeleton className="h-64" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </div>
  )
}
