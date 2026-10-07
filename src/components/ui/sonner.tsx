"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: "calc(var(--bottom-nav-height) + 12px)" }}
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-[var(--st-done-dot)]" />,
        info: <InfoIcon className="size-[18px] text-stone" />,
        warning: <TriangleAlertIcon className="size-[18px] text-[var(--st-due-dot)]" />,
        error: <OctagonXIcon className="size-[18px] text-regal" />,
        loading: <Loader2Icon className="size-[18px] animate-spin text-stone" />,
      }}
      style={
        {
          "--normal-bg": "var(--ink)",
          "--normal-text": "var(--bone)",
          "--normal-border": "var(--ink)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans! text-[0.875rem]! shadow-(--shadow-raised)! gap-3!",
          description: "text-sidebar-muted!",
          actionButton: "bg-bone! text-ink! font-semibold! h-8! px-3! rounded-md!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
