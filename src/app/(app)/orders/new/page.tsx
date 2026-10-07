import type { Metadata } from "next"
import { Suspense } from "react"
import { randomUUID } from "node:crypto"
import { requireAdmin } from "@/lib/auth/session"
import { karachiToday } from "@/lib/format/date"
import { PageHeader } from "@/components/shell/page-header"
import { getClient } from "@/features/clients/queries"
import { listActiveTeam } from "@/features/orders/queries"
import { emptyItem } from "@/features/orders/schema"
import { OrderForm } from "@/features/orders/components/order-form"
import { OrderFormSkeleton } from "@/features/orders/components/order-form-skeleton"

export const metadata: Metadata = { title: "New order" }

export default function NewOrderPage(props: PageProps<"/orders/new">) {
  return (
    <>
      <PageHeader title="New order" description="Add the client, the deadline and each item. Only the item name and quantity are required." />
      <Suspense fallback={<OrderFormSkeleton />}>
        <NewOrder searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function NewOrder({ searchParams }: { searchParams: PageProps<"/orders/new">["searchParams"] }) {
  await requireAdmin()
  const { client: clientParam } = await searchParams
  const clientId = typeof clientParam === "string" && /^[0-9a-f-]{36}$/i.test(clientParam) ? clientParam : null
  const [team, client] = await Promise.all([listActiveTeam(), clientId ? getClient(clientId) : Promise.resolve(null)])
  const today = karachiToday()

  return (
    <OrderForm
      mode="create"
      today={today}
      team={team}
      cancelHref={client ? `/clients/${client.id}` : "/orders"}
      initial={{
        client: client ? { id: client.id, name: client.name, phone: client.phone, company: client.company, address: client.address, city: client.city } : null,
        imageUrls: {},
        received: 0,
        values: {
          id: randomUUID(),
          client_id: client?.id ?? "",
          bill_number: "",
          delivery_address: client?.address ?? "",
          order_date: today,
          delivery_deadline: "",
          responsible_id: "",
          special_instructions: "",
          items: [emptyItem(randomUUID())],
          finance: { order_amount: "", delivery_charges: "" },
        },
      }}
    />
  )
}
