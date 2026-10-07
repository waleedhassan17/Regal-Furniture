import * as React from "react"
import { cn } from "@/lib/utils"

/** Shared look for text-like form controls (input, textarea, select trigger). */
export const fieldClasses =
  "w-full min-w-0 rounded-md border border-input bg-paper px-3.5 text-base text-foreground transition-[border-color,box-shadow] duration-(--duration-fast) outline-none placeholder:text-stone/80 hover:border-stone/70 focus-visible:border-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:bg-sand-soft disabled:opacity-70 aria-invalid:border-regal aria-invalid:ring-3 aria-invalid:ring-regal/10 md:text-sm"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-11 py-2 file:mr-3 file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
