import Link from "next/link"
import { AlarmClock, ArrowRight, Printer, ShieldCheck, Smartphone } from "lucide-react"
import { Lockup } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { RoleChooser } from "@/features/auth/components/role-chooser"

const HIGHLIGHTS = [
  {
    icon: AlarmClock,
    title: "Nothing slips",
    text: "Overdue, due-soon and not-yet-started orders rise to the top every morning.",
  },
  {
    icon: Smartphone,
    title: "Made for the factory floor",
    text: "Update progress, item by item, from any phone — even on a slow connection.",
  },
  {
    icon: Printer,
    title: "Job sheets in one tap",
    text: "Print A4 sheets for the workshop or share an order on WhatsApp.",
  },
  {
    icon: ShieldCheck,
    title: "Money stays in the office",
    text: "Amounts and payments are visible to admins only.",
  },
]

/** Public entry point: what the portal is, and the first step of signing in (choosing a role). */
export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <Link href="/" aria-label="Regal Furnitures — home" className="rounded-md">
          <Lockup priority className="max-w-[9.5rem] sm:max-w-[10.5rem]" />
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">
            Sign in <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-12 px-5 pt-6 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:pt-14">
        <section aria-labelledby="landing-title">
          <p className="eyebrow text-regal">Factory order portal</p>
          <h1
            id="landing-title"
            className="mt-4 max-w-2xl text-[2.375rem] leading-[1.05] font-semibold tracking-[-0.035em] text-ink sm:text-[3.25rem] lg:text-display"
          >
            Every order on time. Nothing forgotten.
          </h1>
          <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-stone">
            Regal&apos;s order book for homes, schools and offices — from the office desk to the factory floor. See at a glance
            what&apos;s late, what&apos;s due and what to start next.
          </p>

          <div className="mt-10 sm:mt-12">
            <h2 className="text-[0.9375rem] font-semibold text-ink">Choose how you&apos;re signing in</h2>
            <RoleChooser className="mt-4" />
            <p className="mt-4 text-caption leading-relaxed text-stone">
              Accounts are created by the office, and your role is set on your account.
            </p>
          </div>
        </section>

        <aside
          aria-labelledby="highlights-title"
          className="relative overflow-hidden rounded-2xl bg-ink p-7 text-bone shadow-(--shadow-raised) sm:p-9"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="pointer-events-none absolute -top-28 -right-28 size-64 text-white/[0.05]"
            fill="none"
          >
            <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          </svg>
          <p className="eyebrow relative text-sidebar-muted">Built for Regal</p>
          <h2 id="highlights-title" className="relative mt-3 text-[1.5rem] leading-snug font-semibold tracking-tight text-white">
            One place for every order, from first sketch to delivery.
          </h2>
          <ul className="relative mt-7 flex flex-col gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10">
                  <Icon aria-hidden="true" className="size-[18px] text-bone" />
                </span>
                <span>
                  <span className="block text-[0.9375rem] font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-sidebar-foreground/80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="relative mt-8 h-1 w-16 rounded-full bg-regal" />
        </aside>
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-caption text-stone sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© Regal Furnitures · Furniture for the way Pakistan lives, studies and works.</p>
          <p>Internal system · For access, contact the office.</p>
        </div>
      </footer>
    </div>
  )
}
