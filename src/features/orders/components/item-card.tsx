"use client"

import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { ArrowDown, ArrowUp, ChevronDown, Copy, EllipsisVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, describedBy } from "@/components/ui/field"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ITEM_DETAIL_FIELDS, type OrderFormValues } from "@/features/orders/schema"
import { ItemPhoto } from "@/features/orders/components/item-photo"

type ItemCardProps = {
  index: number
  count: number
  orderId: string
  savedUrl: string | null
  isSavedPath: (path: string) => boolean
  onDuplicate: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  onBusyChange: (itemId: string, busy: boolean) => void
}

/** One furniture item. Common fields up front; the rarely used materials under "More details". */
export function ItemCard({ index, count, orderId, savedUrl, isSavedPath, onDuplicate, onRemove, onMove, onBusyChange }: ItemCardProps) {
  const { register, setValue, formState, control } = useFormContext<OrderFormValues>()
  const item = useWatch({ control, name: `items.${index}` })
  const errors = formState.errors.items?.[index]
  const detailCount = ITEM_DETAIL_FIELDS.filter((f) => (item?.[f.key] ?? "").toString().trim() !== "").length
  const [moreOpen, setMoreOpen] = useState(detailCount > 0)
  const fieldId = (name: string) => `item-${item?.id ?? index}-${name}`
  const label = item?.name?.trim() ? item.name.trim() : `Item ${index + 1}`

  return (
    <article
      aria-labelledby={fieldId("heading")}
      className="rounded-xl border border-line bg-paper shadow-(--shadow-card) transition-shadow focus-within:border-line-strong"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line py-2 pr-2 pl-4">
        <h3 id={fieldId("heading")} className="flex min-w-0 items-center gap-2.5 text-sm font-bold text-ink">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6875rem] text-bone tabular">
            {index + 1}
          </span>
          <span className="truncate">{label}</span>
        </h3>
        <div className="flex shrink-0 items-center">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`}>
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${label} down`}>
            <ArrowDown aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`More actions for ${label}`}>
                <EllipsisVertical aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy aria-hidden="true" /> Duplicate item
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={count === 1} onSelect={onRemove}>
                <Trash2 aria-hidden="true" /> Remove item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <Field label="Item" htmlFor={fieldId("name")} error={errors?.name?.message}>
            <Input
              id={fieldId("name")}
              placeholder="e.g. Executive table"
              autoComplete="off"
              aria-invalid={!!errors?.name}
              aria-describedby={describedBy(fieldId("name"), { error: errors?.name })}
              {...register(`items.${index}.name`)}
            />
          </Field>
          <Field label="Qty" htmlFor={fieldId("quantity")} error={errors?.quantity?.message}>
            <Input
              id={fieldId("quantity")}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="tabular"
              aria-invalid={!!errors?.quantity}
              aria-describedby={describedBy(fieldId("quantity"), { error: errors?.quantity })}
              {...register(`items.${index}.quantity`)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Size" htmlFor={fieldId("size")} error={errors?.size?.message} optional>
            <Input id={fieldId("size")} placeholder='L= 96" W= 42" H= 30"' autoComplete="off" {...register(`items.${index}.size`)} />
          </Field>
          <Field label="Sheet / laminate code" htmlFor={fieldId("sheet_code")} error={errors?.sheet_code?.message} optional>
            <Input id={fieldId("sheet_code")} placeholder="A.N 4091, 2028" autoComplete="off" {...register(`items.${index}.sheet_code`)} />
          </Field>
        </div>

        <Field label="Note" htmlFor={fieldId("note")} error={errors?.note?.message} optional>
          <Textarea id={fieldId("note")} rows={2} className="min-h-16" placeholder="Anything the factory should know about this item" {...register(`items.${index}.note`)} />
        </Field>

        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between rounded-md border border-dashed border-line-strong px-3 text-sm font-semibold text-ink hover:bg-subtle/60"
            >
              <span>
                More details
                {detailCount > 0 ? (
                  <span className="ml-2 font-medium text-stone">{detailCount} filled</span>
                ) : (
                  <span className="ml-2 hidden font-medium text-stone sm:inline">metal, PC, rack, fabric, foam…</span>
                )}
              </span>
              <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-(--duration-base)", moreOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {ITEM_DETAIL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label} htmlFor={fieldId(f.key)} error={errors?.[f.key]?.message}>
                  <Input id={fieldId(f.key)} autoComplete="off" placeholder={f.placeholder} {...register(`items.${index}.${f.key}`)} />
                </Field>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col gap-2">
          <p className="text-[0.8125rem] font-semibold text-ink">
            Reference photo <span className="font-medium text-stone">(optional)</span>
          </p>
          <ItemPhoto
            orderId={orderId}
            itemId={item?.id ?? ""}
            itemLabel={label}
            path={item?.image_path ?? null}
            savedUrl={savedUrl}
            isSavedPath={isSavedPath}
            onBusyChange={onBusyChange}
            onChange={(path) => setValue(`items.${index}.image_path`, path, { shouldDirty: true })}
          />
          {errors?.image_path?.message && (
            <p role="alert" className="text-caption font-semibold text-[var(--st-overdue-fg)]">
              {errors.image_path.message}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
