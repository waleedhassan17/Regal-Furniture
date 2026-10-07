import type { Metadata } from "next"
import { Suspense } from "react"
import { getOrderTitle, getOrderDetail } from "@/features/orders/queries"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Archive, ArrowLeft, CalendarDays, Hash, MapPin, Phone, ScrollText, UserRound } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { getSiteUrl } from "@/lib/site-url"
import { formatDate, karachiToday } from "@/lib/format/date"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DaysLeftBadge } from "@/components/data/days-left-badge"
import { AttentionBadge } from "@/components/data/status-badge"
import { buildWhatsAppMessage, whatsAppShareUrl } from "@/features/orders/whatsapp"
import { StatusControl } from "@/features/orders/components/status-control"
import { OrderActions } from "@/features/orders/components/order-actions"
import { OrderItems } from "@/features/orders/components/order-items"
import { OrderNotes } from "@/features/orders/components/order-notes"
import { StatusTimeline } from "@/features/orders/components/status-timeline"
import { PaymentsPanel } from "@/features/payments/components/payments-panel"

export async function generateMetadata(props: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await props.params
  return { title: (await getOrderTitle(id)) ?? "Order" }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-stone hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" /> All orders
      </Link>
      <Suspense fallback={<OrderSkeleton />}>
        <OrderContent params={props.params} />
      </Suspense>
    </>
  )
}

async function OrderContent({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  const user = await requireUser()
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const detail = await getOrderDetail(id, { isAdmin: user.isAdmin })
  if (!detail) notFound()
  const { order, client, items, notes, history, money } = detail

  const whatsApp = whatsAppShareUrl(
    buildWhatsAppMessage({
      orderId: order.id,
      orderNumber: order.order_number,
      clientName: order.client_name,
      deliveryDeadline: order.delivery_deadline,
      daysLeft: order.days_left,
      status: order.status,
      responsibleName: order.responsible_name,
      specialInstructions: order.special_instructions,
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, size: i.size })),
      siteUrl: await getSiteUrl(),
    })
  )
  const phones = [client?.phone, client?.alt_phone].filter((p): p is string => !!p)

  return (
    <div className="flex flex-col gap-6">
      {order.is_archived && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-sand-strong bg-sand-soft px-4 py-3 text-sm text-ink">
          <Archive aria-hidden="true" className="size-4 shrink-0 text-stone" />
          This order is archived. It&apos;s hidden from lists and reminders{user.isAdmin ? " — restore it from the menu to make changes." : "."}
        </div>
      )}

      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-regal">
            Order {order.order_number}
            {order.bill_number ? ` · Bill ${order.bill_number}` : ""}
          </p>
          <h1 className="mt-2 font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">{order.client_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusControl orderId={order.id} orderNumber={order.order_number} status={order.status} disabled={order.is_archived} />
            <DaysLeftBadge daysLeft={order.days_left} attention={order.attention_level} status={order.status} isArchived={order.is_archived} className="h-9" />
            {/* "Overdue" is already in the days-left badge; the other two levels add information. */}
            {(order.attention_level === "due_soon" || order.attention_level === "needs_to_start") && (
              <AttentionBadge level={order.attention_level} className="h-9" />
            )}
          </div>
        </div>
        <OrderActions orderId={order.id} orderNumber={order.order_number} isAdmin={user.isAdmin} isArchived={order.is_archived} whatsAppUrl={whatsApp} />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Fact icon={CalendarDays} label="Delivery deadline">
                <span className="font-semibold">{formatDate(order.delivery_deadline)}</span>
              </Fact>
              <Fact icon={Hash} label="Order date">
                {formatDate(order.order_date)}
              </Fact>
              <Fact icon={UserRound} label="Person responsible">
                {order.responsible_name ?? <span className="text-stone">Not assigned</span>}
              </Fact>
              <Fact icon={Phone} label="Client phone">
                {phones.length ? (
                  <span className="flex flex-col gap-1">
                    {phones.map((p) => (
                      <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="font-semibold text-ink underline-offset-4 hover:text-regal hover:underline">
                        {p}
                      </a>
                    ))}
                  </span>
                ) : (
                  <span className="text-stone">No phone saved</span>
                )}
              </Fact>
              <Fact icon={MapPin} label="Delivery address" className="sm:col-span-2">
                {order.delivery_address ? <span className="whitespace-pre-line">{order.delivery_address}</span> : <span className="text-stone">No address</span>}
              </Fact>
              {order.special_instructions && (
                <Fact icon={ScrollText} label="Special instructions" className="sm:col-span-2">
                  <span className="block rounded-md border-l-[3px] border-walnut bg-[var(--st-start-bg)] px-3 py-2 whitespace-pre-line text-ink">
                    {order.special_instructions}
                  </span>
                </Fact>
              )}
              <div className="sm:col-span-2">
                <Link href={`/clients/${order.client_id}`} className="text-sm font-semibold text-regal underline-offset-4 hover:underline">
                  View client and order history →
                </Link>
              </div>
            </CardContent>
          </Card>

          <OrderItems orderId={order.id} items={items} canChangeStatus={!order.is_archived} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {user.isAdmin && money && (
            <PaymentsPanel
              orderId={order.id}
              orderAmount={money.orderAmount}
              deliveryCharges={money.deliveryCharges}
              payments={money.payments}
              today={karachiToday()}
              editHref={`/orders/${order.id}/edit`}
            />
          )}
          <OrderNotes orderId={order.id} notes={notes} canDelete={user.isAdmin} />
          <StatusTimeline entries={history} />
        </div>
      </div>
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof Phone
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-caption font-semibold text-stone">
        <Icon aria-hidden="true" className="size-3.5" /> {label}
      </p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading order">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-96" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )
}
