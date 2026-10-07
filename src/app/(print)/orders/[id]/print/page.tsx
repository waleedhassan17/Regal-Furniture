import type { Metadata } from "next"
import { Suspense } from "react"
import { getOrderTitle, getOrderDetail } from "@/features/orders/queries"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/auth/session"
import { formatDate, formatDateTime } from "@/lib/format/date"
import { formatDaysLeft } from "@/lib/format/days-left"
import { PRODUCTION_STATUS_LABEL } from "@/lib/domain/status"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Lockup } from "@/components/brand/logo"
import { ITEM_DETAIL_FIELDS } from "@/features/orders/schema"
import { PrintButton } from "@/features/orders/components/print-button"
import "./print.css"

export async function generateMetadata(props: PageProps<"/orders/[id]/print">): Promise<Metadata> {
  const { id } = await props.params
  const title = await getOrderTitle(id)
  return { title: title ? `Job sheet ${title}` : "Job sheet" }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function JobSheetPage(props: PageProps<"/orders/[id]/print">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[210mm] p-8"><Skeleton className="h-[297mm] bg-white" /></div>}>
      <JobSheet params={props.params} />
    </Suspense>
  )
}

async function JobSheet({ params }: { params: PageProps<"/orders/[id]/print">["params"] }) {
  await requireUser()
  const { id } = await params
  if (!UUID.test(id)) notFound()
  // Money is never loaded here: the job sheet goes to the factory floor.
  const detail = await getOrderDetail(id, { isAdmin: false })
  if (!detail) notFound()
  const { order, items } = detail
  const totalPieces = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <div className="no-print sticky top-0 z-10 border-b border-sand bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-3">
          <Button asChild variant="ghost">
            <Link href={`/orders/${order.id}`}>
              <ArrowLeft aria-hidden="true" /> Back to order
            </Link>
          </Button>
          <p className="hidden text-sm text-stone sm:block">A4 · {items.length} items · no prices</p>
          <PrintButton />
        </div>
      </div>

      <main className="job-sheet mx-auto my-6 max-w-[210mm] bg-white px-[12mm] py-[12mm] text-ink shadow-(--shadow-raised) print:m-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
          <div>
            <Lockup className="max-w-[46mm]" />
            <p className="mt-3 text-[9pt] font-bold tracking-[0.18em] text-regal uppercase">Factory job sheet</p>
          </div>
          <div className="text-right">
            <p className="font-display text-[22pt] leading-none font-bold tabular">{order.order_number}</p>
            {order.bill_number && <p className="mt-1 text-[9pt] text-stone">Bill {order.bill_number}</p>}
          </div>
        </header>

        <section className="mt-4 grid grid-cols-4 gap-x-4 gap-y-3 border-b border-sand-strong pb-4 text-[9.5pt]">
          <Info label="Client" className="col-span-2">
            <span className="text-[12pt] font-bold">{order.client_name}</span>
            {order.client_phone && <span className="block text-stone">{order.client_phone}</span>}
          </Info>
          <Info label="Delivery deadline" className="col-span-2">
            <span className="text-[12pt] font-bold">{formatDate(order.delivery_deadline)}</span>
            <span className="block text-stone">{formatDaysLeft(order.days_left)}</span>
          </Info>
          <Info label="Order date">{formatDate(order.order_date)}</Info>
          <Info label="Status">{PRODUCTION_STATUS_LABEL[order.status]}</Info>
          <Info label="Responsible">{order.responsible_name ?? "—"}</Info>
          <Info label="Items">
            {items.length} · {totalPieces} pcs
          </Info>
          {order.delivery_address && (
            <Info label="Delivery address" className="col-span-4">
              <span className="whitespace-pre-line">{order.delivery_address}</span>
            </Info>
          )}
          {order.special_instructions && (
            <Info label="Special instructions" className="col-span-4">
              <span className="block border-l-[3px] border-ink pl-2 font-semibold whitespace-pre-line">{order.special_instructions}</span>
            </Info>
          )}
        </section>

        {/* A table so the small running header repeats at the top of every printed page. */}
        <table className="mt-3 w-full border-separate border-spacing-y-2">
          <thead className="hidden print:table-header-group">
            <tr>
              <td className="p-0">
                <div className="flex justify-between border-b border-sand-strong pb-1 text-[7.5pt] text-stone">
                  <span>
                    <strong className="font-bold text-ink">{order.order_number}</strong> · {order.client_name}
                  </span>
                  <span>Due {formatDate(order.delivery_deadline)}</span>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
          {items.map((item, index) => {
            const materials = [
              { label: "Sheet", value: item.sheet_code },
              ...ITEM_DETAIL_FIELDS.map((f) => ({ label: f.label, value: item[f.key] })),
            ].filter((m) => m.value)
            return (
              <tr key={item.id} className="job-block">
              <td className="p-0">
              <div className="flex border border-ink text-[9pt] leading-snug">
                <div className="flex w-[8mm] shrink-0 justify-center border-r border-ink bg-sand-soft pt-1.5 text-[10.5pt] font-bold tabular print:bg-[#f0eadf]">
                  {index + 1}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 px-2.5 py-1.5">
                  <p className="text-[10.5pt] font-bold">{item.name}</p>
                  {item.size && (
                    <p>
                      <span className="mr-1.5 text-[7pt] font-bold tracking-[0.08em] text-stone uppercase">Size</span>
                      <span className="font-semibold">{item.size}</span>
                    </p>
                  )}
                  {materials.length > 0 && (
                    <p className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {materials.map((m) => (
                        <span key={m.label}>
                          <span className="mr-1 text-[7pt] font-bold tracking-[0.08em] text-stone uppercase">{m.label}</span>
                          {m.value}
                        </span>
                      ))}
                    </p>
                  )}
                  {item.note && (
                    <p className="border-l-2 border-sand-strong pl-2 whitespace-pre-line">
                      <span className="mr-1 text-[7pt] font-bold tracking-[0.08em] text-stone uppercase">Note</span>
                      {item.note}
                    </p>
                  )}
                </div>
                <div className="flex w-[17mm] shrink-0 flex-col items-center justify-between border-l border-ink py-1.5">
                  <div className="text-center">
                    <p className="text-[7pt] font-bold tracking-[0.08em] text-stone uppercase">Qty</p>
                    <p className="text-[14pt] leading-none font-bold tabular">{item.quantity}</p>
                  </div>
                  <p className="text-[7.5pt] text-stone">☐ Ready</p>
                </div>
                {item.image_url && (
                  <div className="relative min-h-[32mm] w-[42mm] shrink-0 border-l border-ink">
                    <Image src={item.image_url} alt={`Photo: ${item.name}`} fill unoptimized sizes="160px" className="object-contain p-1" />
                  </div>
                )}
              </div>
              </td>
              </tr>
            )
          })}
          </tbody>
        </table>

        <footer className="mt-6 flex items-end justify-between gap-4 border-t border-sand-strong pt-3 text-[8pt] text-stone">
          <span>
            Printed {formatDateTime(new Date().toISOString())} · {order.order_number} · {order.client_name}
          </span>
          <span>Checked by: ____________________</span>
        </footer>
      </main>
    </>
  )
}

function Info({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[7.5pt] font-bold tracking-[0.1em] text-stone uppercase">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}
