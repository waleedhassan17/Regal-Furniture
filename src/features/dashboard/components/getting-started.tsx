import Link from "next/link"
import { ArrowRight, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { SetupProgress } from "@/features/dashboard/queries"

/** First-run checklist for admins, shown until the first order exists. */
export function GettingStarted({ progress, welcome }: { progress: SetupProgress; welcome: boolean }) {
  const steps = [
    {
      done: progress.hasCompany,
      title: "Company details",
      text: "Name, phone and address used on job sheets.",
      href: "/settings",
      action: "Add details",
    },
    {
      done: progress.teamSize > 1,
      title: "Add your team",
      text: "Create accounts for office staff and the factory floor.",
      href: "/team",
      action: "Add people",
    },
    {
      done: progress.clients > 0,
      title: "Add your first client",
      text: "Or add clients as you enter orders.",
      href: "/clients",
      action: "Add a client",
    },
    {
      done: progress.orders > 0,
      title: "Create your first order",
      text: "Items, deadline and amounts — it then shows up here.",
      href: "/orders/new",
      action: "New order",
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <section aria-labelledby="get-started-title" className="rounded-xl border border-line bg-paper">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id="get-started-title" className="text-[1.0625rem] font-semibold tracking-tight text-ink">
            {welcome ? "Your company is registered" : "Get started"}
          </h2>
          <p className="mt-0.5 text-sm text-stone">
            {welcome ? "You're the owner and first admin. A few steps to get the portal ready for your team." : "A few steps to get the portal ready for your team."}
          </p>
        </div>
        <p className="text-sm font-medium text-stone tabular">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <ol className="divide-y divide-line">
        {steps.map((step) => (
          <li key={step.title} className="flex items-center gap-4 px-5 py-4 sm:px-6">
            {step.done ? (
              <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-[var(--st-done-dot)]" />
            ) : (
              <Circle aria-hidden="true" className="size-5 shrink-0 text-line-strong" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", step.done ? "text-stone line-through decoration-stone/40" : "text-ink")}>
                {step.title}
                <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
              </p>
              <p className="mt-0.5 text-caption text-stone">{step.text}</p>
            </div>
            {!step.done && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={step.href}>
                  {step.action} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
