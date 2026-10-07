"use client"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CalendarClock, Hourglass, TimerReset } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormAlert } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { HexFrame } from "@/components/brand/hexagon"
import { updateSettingsAction } from "@/features/settings/actions"
import { settingsSchema, type SettingsFormValues, type SettingsValues } from "@/features/settings/schema"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export function SettingsForm({ initial }: { initial: { dueSoonDays: number; startWarningDays: number; notStartedGraceDays: number } }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<SettingsFormValues, unknown, SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      due_soon_days: String(initial.dueSoonDays),
      start_warning_days: String(initial.startWarningDays),
      not_started_grace_days: String(initial.notStartedGraceDays),
    },
  })
  const { errors, isDirty } = form.formState
  const values = useWatch({ control: form.control })
  const n = (v: string | undefined, fallback: number) => (v && /^\d+$/.test(v) ? Number(v) : fallback)
  const dueSoon = n(values.due_soon_days, initial.dueSoonDays)
  const startWarn = n(values.start_warning_days, initial.startWarningDays)
  const grace = n(values.not_started_grace_days, initial.notStartedGraceDays)

  const submit = form.handleSubmit(() => {
    setServerError(null)
    const raw = form.getValues()
    startTransition(async () => {
      const result = await updateSettingsAction(raw)
      if (!result.ok) return setServerError(result.error)
      toast.success(result.message ?? "Saved")
      form.reset(raw)
    })
  })

  return (
    <form onSubmit={submit} noValidate className="flex max-w-3xl flex-col gap-4">
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <Setting
        id="due_soon_days"
        icon={CalendarClock}
        tone="due"
        title="Due soon"
        unit="days before the deadline"
        error={errors.due_soon_days?.message}
        input={<Input id="due_soon_days" inputMode="numeric" className="w-24 text-center tabular" aria-invalid={!!errors.due_soon_days} {...form.register("due_soon_days")} />}
      >
        An open order is marked <strong>Due soon</strong> when its deadline is {dueSoon === 0 ? "today" : `${plural(dueSoon, "day")} away or less`}. Deadlines
        already passed are always <strong>Overdue</strong>.
      </Setting>

      <Setting
        id="start_warning_days"
        icon={Hourglass}
        tone="start"
        title="Start warning"
        unit="days before the deadline"
        error={errors.start_warning_days?.message}
        input={<Input id="start_warning_days" inputMode="numeric" className="w-24 text-center tabular" aria-invalid={!!errors.start_warning_days} {...form.register("start_warning_days")} />}
      >
        An order still marked <strong>New</strong> is flagged <strong>Needs to start</strong> once its deadline is {plural(startWarn, "day")} away or less.
      </Setting>

      <Setting
        id="not_started_grace_days"
        icon={TimerReset}
        tone="start"
        title="Not-started grace period"
        unit="days after the order"
        error={errors.not_started_grace_days?.message}
        input={<Input id="not_started_grace_days" inputMode="numeric" className="w-24 text-center tabular" aria-invalid={!!errors.not_started_grace_days} {...form.register("not_started_grace_days")} />}
      >
        Even with a distant deadline, an order still marked <strong>New</strong> {plural(grace, "day")} after it was placed is flagged{" "}
        <strong>Needs to start</strong> — so nothing sits untouched.
      </Setting>

      <div className="flex items-center justify-end gap-3 pt-2">
        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={pending}>
            Undo changes
          </Button>
        )}
        <Button type="submit" disabled={pending || !isDirty}>
          {pending && <Spinner />} Save settings
        </Button>
      </div>
    </form>
  )
}

function Setting({
  id,
  icon: Icon,
  tone,
  title,
  unit,
  error,
  input,
  children,
}: {
  id: string
  icon: typeof Hourglass
  tone: "due" | "start"
  title: string
  unit: string
  error?: string
  input: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 rounded-xl border border-sand bg-card p-5 shadow-(--shadow-card) sm:flex-row sm:items-start sm:gap-5 sm:p-6">
      <HexFrame size={48} stroke={`var(--st-${tone}-dot)`} fill={`var(--st-${tone}-bg)`}>
        <Icon aria-hidden="true" className="size-5" style={{ color: `var(--st-${tone}-fg)` }} />
      </HexFrame>
      <div className="flex-1">
        <h2 id={`${id}-title`} className="text-h3 font-bold text-ink">
          <label htmlFor={id}>{title}</label>
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone [&_strong]:font-semibold [&_strong]:text-ink">{children}</p>
        {error && (
          <p role="alert" className="mt-2 text-caption font-semibold text-[var(--st-overdue-fg)]">
            {error}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        {input}
        <span className="text-caption text-stone">{unit}</span>
      </div>
    </section>
  )
}
