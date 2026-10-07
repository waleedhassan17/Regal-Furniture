"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

/**
 * Thin progress bar. Ink by default — red is reserved for urgent states.
 * Pass `tone="done"` for completion progress (e.g. items ready).
 */
function Progress({
  className,
  value,
  tone = "ink",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: "ink" | "done" }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-line", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 transition-transform duration-(--duration-base) ease-(--ease-out)",
          tone === "done" ? "bg-[var(--st-done-dot)]" : "bg-ink"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
