import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-out) outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-crimson active:bg-crimson",
        ink: "bg-ink text-bone hover:bg-charcoal",
        outline:
          "border-line-strong bg-paper text-foreground hover:border-stone/40 hover:bg-subtle aria-expanded:bg-subtle",
        secondary:
          "bg-subtle text-foreground hover:bg-line aria-expanded:bg-line",
        ghost:
          "text-foreground hover:bg-subtle aria-expanded:bg-subtle",
        destructive:
          "border-regal/30 bg-paper text-regal hover:border-regal hover:bg-[var(--st-overdue-bg)]",
        link: "h-auto! px-0! text-regal underline-offset-4 hover:text-crimson hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 gap-1.5 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
