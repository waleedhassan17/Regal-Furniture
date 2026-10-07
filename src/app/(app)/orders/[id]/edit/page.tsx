import type { Metadata } from "next"
import { Suspense } from "react"
import { getOrderTitle, getOrderForEdit, getOrderMoney, listActiveTeam } from "@/features/orders/queries"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { requireAdmin } from "@/lib/auth/session"
import { karachiToday } from "@/lib/format/date"
import { PageHeader } from "@/components/shell/page-header"
import { OrderForm } from "@/features/orders/components/order-form"
import { OrderFormSkeleton } from "@/features/orders/components/order-form-skeleton"

export async function generateMetadata(props: PageProps<"/orders/[id]/edit">): Promise<Metadata> {
  const { id } = await props.params
  const title = await getOrderTitle(id)
  return { title: title ? `Edit ${title}` : "Edit order" }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function EditOrderPage(props: PageProps<"/orders/[id]/edit">) {
  return (
    <Suspense fallback={<><PageHeader title="Edit order" /><OrderFormSkeleton /></>}>
      <EditOrder params={props.params} />
    </Suspense>
  )
}

async function EditOrder({ params }: { params: PageProps<"/orders/[id]/edit">["params"] }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const [data, team, money] = await Promise.all([getOrderForEdit(id), listActiveTeam(), getOrderMoney(id)])
  if (!data) notFound()
  const { order, items, finance } = data

  // Keep the current responsible person selectable even if they have since been deactivated.
  const options =
    order.responsible_id && !team.some((p) => p.id === order.responsible_id)
      ? [...team, { id: order.responsible_id, full_name: `${order.responsible?.full_name ?? "Former team member"} (no longer active)`, role: "staff" as const }]
      : team
  const imageUrls: Record<string, string> = {}
  for (const item of items) if (item.image_path && item.image_url) imageUrls[item.image_path] = item.image_url
  const received = (money?.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  const str = (v: string | null | undefined) => v ?? ""

  return (
    <>
      <PageHeader
        title={`Edit ${order.order_number}`}
        description={order.client ? `For ${order.client.name}` : undefined}
        back={
          <Link href={`/orders/${order.id}`} className="inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-stone hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to order
          </Link>
        }
      />
      <OrderForm
        mode="edit"
        today={karachiToday()}
        team={options}
        cancelHref={`/orders/${order.id}`}
        initial={{
          client: order.client,
          imageUrls,
          received,
          values: {
            id: order.id,
            client_id: order.client_id,
            bill_number: str(order.bill_number),
            delivery_address: str(order.delivery_address),
            order_date: order.order_date,
            delivery_deadline: order.delivery_deadline,
            responsible_id: str(order.responsible_id),
            special_instructions: str(order.special_instructions),
            items: items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: String(item.quantity),
              size: str(item.size),
              sheet_code: str(item.sheet_code),
              metal_colour: str(item.metal_colour),
              pc: str(item.pc),
              rack: str(item.rack),
              fabric: str(item.fabric),
              leather: str(item.leather),
              foam: str(item.foam),
              railing: str(item.railing),
              lock: str(item.lock),
              note: str(item.note),
              image_path: item.image_path,
            })),
            finance: {
              order_amount: finance?.order_amount === null || finance?.order_amount === undefined ? "" : String(finance.order_amount),
              delivery_charges: finance?.delivery_charges ? String(finance.delivery_charges) : "",
            },
          },
        }}
      />
    </>
  )
}
