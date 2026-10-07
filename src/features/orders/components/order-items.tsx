"use client"

import { useOptimistic, useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Expand, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ITEM_STATUS_TONE } from "@/components/data/status-badge"
import { ITEM_STATUSES, ITEM_STATUS_LABEL, type ItemStatus } from "@/lib/domain/status"
import { formatReadyProgress } from "@/lib/format/items"
import { changeItemStatusAction } from "@/features/orders/actions"
import { ITEM_DETAIL_FIELDS } from "@/features/orders/schema"
import type { OrderItemRow } from "@/features/orders/queries"

type OrderItemsProps = {
  orderId: string
  items: OrderItemRow[]
  canChangeStatus: boolean
}

/** Items with materials, photos and a per-item status switch, plus "x of y items ready". */
export function OrderItems({ orderId, items, canChangeStatus }: OrderItemsProps) {
  const [optimisticItems, setOptimisticStatus] = useOptimistic(items, (state, update: { id: string; status: ItemStatus }) =>
    state.map((item) => (item.id === update.id ? { ...item, status: update.status } : item))
  )
  const [, startTransition] = useTransition()
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null)
  const ready = optimisticItems.filter((i) => i.status === "ready").length

  function changeStatus(item: OrderItemRow, status: ItemStatus, isUndo = false) {
    startTransition(async () => {
      setOptimisticStatus({ id: item.id, status })
      const result = await changeItemStatusAction({ orderId, itemId: item.id, status })
      if (!result.ok) return void toast.error(result.error)
      if (isUndo) return
      const previous = result.data.previous
      toast.success(`${item.name}: ${ITEM_STATUS_LABEL[status]}`, {
        action: { label: "Undo", onClick: () => changeStatus(item, previous, true) },
      })
    })
  }

  return (
    <section aria-labelledby="items-heading" className="rounded-xl border border-line bg-card shadow-(--shadow-card)">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="items-heading" className="text-h3 font-bold text-ink">
            Items <span className="font-semibold text-stone tabular">({items.length})</span>
          </h2>
          <p className="text-sm font-semibold text-ink tabular" aria-live="polite">
            {formatReadyProgress(ready, items.length)}
          </p>
        </div>
        <Progress tone="done" value={items.length ? (ready / items.length) * 100 : 0} aria-label={formatReadyProgress(ready, items.length)} />
      </div>

      <ol className="divide-y divide-line">
        {optimisticItems.map((item, index) => {
          const details = [
            { label: "Size", value: item.size },
            { label: "Sheet / laminate", value: item.sheet_code },
            ...ITEM_DETAIL_FIELDS.map((f) => ({ label: f.label, value: item[f.key] })),
          ].filter((d) => d.value)
          return (
            <li key={item.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:px-6">
              {item.image_url ? (
                <button
                  type="button"
                  onClick={() => setPhoto({ url: item.image_url as string, name: item.name })}
                  className="group relative size-24 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle sm:size-28"
                  aria-label={`View photo of ${item.name}`}
                >
                  <Image src={item.image_url} alt="" fill unoptimized sizes="112px" className="object-cover transition-transform duration-(--duration-base) group-hover:scale-105" />
                  <span className="absolute right-1.5 bottom-1.5 rounded-md bg-ink/70 p-1 text-bone">
                    <Expand aria-hidden="true" className="size-3.5" />
                  </span>
                </button>
              ) : item.image_path ? (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-stone sm:size-28" title="Photo unavailable">
                  <ImageOff aria-hidden="true" className="size-5" />
                </div>
              ) : null}

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-caption font-bold text-stone tabular">Item {index + 1}</p>
                    <h3 className="text-[1rem] font-bold text-ink">
                      {item.name} <span className="font-semibold text-stone tabular">× {item.quantity}</span>
                    </h3>
                  </div>
                  <ItemStatusSwitch
                    value={item.status}
                    disabled={!canChangeStatus}
                    label={item.name}
                    onChange={(status) => status !== item.status && changeStatus(item, status)}
                  />
                </div>
                {details.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    {details.map((d) => (
                      <div key={d.label} className="min-w-0">
                        <dt className="text-caption font-semibold text-stone">{d.label}</dt>
                        <dd className="break-words text-ink">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {item.note && <p className="rounded-md bg-subtle/70 px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-ink">{item.note}</p>}
              </div>
            </li>
          )
        })}
      </ol>

      <Dialog open={photo !== null} onOpenChange={(open) => !open && setPhoto(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{photo?.name}</DialogTitle>
            <DialogDescription>Reference photo</DialogDescription>
          </DialogHeader>
          {photo && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-subtle">
              <Image src={photo.url} alt={`Reference photo for ${photo.name}`} fill unoptimized sizes="(max-width: 768px) 100vw, 768px" className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

/** Three-way switch: Pending · In production · Ready. Large targets for phones. */
function ItemStatusSwitch({ value, onChange, disabled, label }: { value: ItemStatus; onChange: (v: ItemStatus) => void; disabled: boolean; label: string }) {
  return (
    <div role="radiogroup" aria-label={`Status of ${label}`} className="inline-flex rounded-lg border border-line-strong bg-paper p-0.5">
      {ITEM_STATUSES.map((status) => {
        const active = status === value
        const tone = ITEM_STATUS_TONE[status]
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(status)}
            onKeyDown={(e) => {
              const i = ITEM_STATUSES.indexOf(value)
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                onChange(ITEM_STATUSES[(i + 1) % ITEM_STATUSES.length])
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                onChange(ITEM_STATUSES[(i - 1 + ITEM_STATUSES.length) % ITEM_STATUSES.length])
              }
            }}
            tabIndex={active ? 0 : -1}
            className={cn(
              "h-11 rounded-md px-3 text-[0.75rem] font-bold whitespace-nowrap transition-colors duration-(--duration-fast) disabled:cursor-not-allowed sm:h-9",
              active ? "shadow-(--shadow-card)" : "text-stone hover:bg-subtle hover:text-ink"
            )}
            style={active ? { color: `var(--st-${tone}-fg)`, backgroundColor: `var(--st-${tone}-bg)` } : undefined}
          >
            {ITEM_STATUS_LABEL[status]}
          </button>
        )
      })}
    </div>
  )
}
