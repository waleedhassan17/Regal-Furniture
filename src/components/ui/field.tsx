import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type FieldProps = {
  label: React.ReactNode
  htmlFor: string
  error?: string
  hint?: React.ReactNode
  optional?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Label + control + hint/error, wired for screen readers. The control must use
 * id={htmlFor}, aria-invalid and aria-describedby={describedBy(htmlFor, …)}.
 */
export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="font-medium text-stone">(optional)</span>}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-caption text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-caption font-semibold text-[var(--st-overdue-fg)]">
          {error}
        </p>
      )}
    </div>
  )
}

/** aria-describedby value for a field's hint and error. */
export function describedBy(id: string, opts: { error?: unknown; hint?: unknown }) {
  return [opts.error ? `${id}-error` : null, opts.hint && !opts.error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
}

/** Inline banner for form-level errors. */
export function FormAlert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "info" | "success" }) {
  const map = { error: "overdue", info: "track", success: "done" } as const
  const t = map[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="rounded-md border px-4 py-3 text-sm leading-relaxed font-medium"
      style={{ color: `var(--st-${t}-fg)`, backgroundColor: `var(--st-${t}-bg)`, borderColor: `var(--st-${t}-bd)` }}
    >
      {children}
    </div>
  )
}
