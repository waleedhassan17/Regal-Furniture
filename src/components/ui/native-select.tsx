import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "@/components/ui/input"

/**
 * Styled native <select>. Preferred on phones: the OS picker is fast, familiar and accessible.
 */
function NativeSelect({ className, children, size = "default", ...props }: Omit<React.ComponentProps<"select">, "size"> & { size?: "default" | "sm" }) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(fieldClasses, "appearance-none pr-10", size === "sm" ? "h-9 text-sm" : "h-11", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone" />
    </div>
  )
}

export { NativeSelect }
