"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRODUCTION_STATUS_TONE, toneStyle } from "@/components/data/status-badge"
import { PRODUCTION_STATUS_LABEL, type ProductionStatus } from "@/lib/domain/status"
import { changeOrderStatusAction } from "@/features/orders/actions"

const FLOW: ProductionStatus[] = ["new", "in_production", "ready_for_delivery", "delivered"]
const SIDE: ProductionStatus[] = ["on_hold", "cancelled"]

type StatusControlProps = {
  orderId: string
  orderNumber: string
  status: ProductionStatus
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
}

/**
 * Tap the status pill to change it. The change shows instantly, is confirmed with a toast,
 * and can be undone from the toast in case of a mistaken tap.
 */
export function StatusControl({ orderId, orderNumber, status, disabled, size = "md", className }: StatusControlProps) {
  const [optimistic, setOptimistic] = useOptimistic(status)
  const [pending, startTransition] = useTransition()

  function change(next: ProductionStatus, { isUndo = false } = {}) {
    // Undo runs from a toast created by an earlier render, so it must not compare against
    // that render's (stale) status; the server treats an unchanged status as a no-op anyway.
    if (!isUndo && next === optimistic) return
    startTransition(async () => {
      setOptimistic(next)
      const result = await changeOrderStatusAction({ orderId, status: next })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (isUndo) {
        toast(`${orderNumber} set back to ${PRODUCTION_STATUS_LABEL[next].toLowerCase()}`)
        return
      }
      const previous = result.data.previous
      toast.success(`Status: ${PRODUCTION_STATUS_LABEL[next]}`, {
        description: orderNumber,
        action: { label: "Undo", onClick: () => change(previous, { isUndo: true }) },
      })
    })
  }

  const tone = PRODUCTION_STATUS_TONE[optimistic]
  const nextStep = FLOW[FLOW.indexOf(optimistic) + 1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || pending}
        style={toneStyle(tone)}
        aria-label={`Status: ${PRODUCTION_STATUS_LABEL[optimistic]}. Change status of ${orderNumber}`}
        className={cn(
          "group inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap transition-[filter] outline-none hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70",
          size === "md" ? "h-9 pr-2.5 pl-3 text-[0.8125rem]" : "h-8 pr-2 pl-2.5 text-[0.75rem]",
          pending && "animate-pulse",
          className
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: `var(--st-${tone}-dot)` }} />
        {PRODUCTION_STATUS_LABEL[optimistic]}
        {!disabled && <ChevronDown aria-hidden="true" className="size-3.5 opacity-70" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {nextStep && (
          <>
            <DropdownMenuLabel>Next step</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => change(nextStep)} className="font-semibold">
              <Dot status={nextStep} /> Mark as {PRODUCTION_STATUS_LABEL[nextStep].toLowerCase()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>All statuses</DropdownMenuLabel>
        {[...FLOW, ...SIDE].map((s) => (
          <DropdownMenuItem key={s} onSelect={() => change(s)} aria-current={s === optimistic ? "true" : undefined}>
            <Dot status={s} />
            <span className="flex-1">{PRODUCTION_STATUS_LABEL[s]}</span>
            {s === optimistic && <Check aria-hidden="true" className="size-4 text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Dot({ status }: { status: ProductionStatus }) {
  return <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: `var(--st-${PRODUCTION_STATUS_TONE[status]}-dot)` }} />
}
