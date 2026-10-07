import Link from "next/link"
import { Lockup } from "@/components/brand/logo"
import { HexOutline } from "@/components/brand/hexagon"
import { Button } from "@/components/ui/button"
import { RoleChooser } from "@/features/auth/components/role-chooser"

/** Brand pillars, worded as in the Regal brand book (page 2). */
const PILLARS = [
  { name: "Craft", text: "Joinery and finish that outlast trends." },
  { name: "Versatility", text: "One brand for home, school and office." },
  { name: "Accessible", text: "Premium feel, locally-made value." },
  { name: "Enduring", text: "Built to be inherited, not replaced." },
]

/** Public home page, laid out like the brand book cover, with sign-in as the main action. */
export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Regal Furnitures — home" className="rounded-md">
            <Lockup priority className="max-w-[9rem]" />
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="#about">About Regal</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Cover: tagline and sign-in on the left, Regal Red on the right (brand book, page 1). */}
        <section className="grid grid-cols-1 lg:min-h-[36rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="px-5 py-12 sm:px-8 sm:py-16 lg:py-20 lg:pr-16 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            <p className="text-sm font-medium text-stone">Regal Furnitures · Order portal</p>
            <h1 className="mt-4 max-w-xl text-[2.25rem] leading-[1.08] font-semibold tracking-[-0.03em] text-ink sm:text-[3rem]">
              Furniture for the way Pakistan lives, studies and works.
            </h1>
            <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-stone">
              From a child&apos;s first study desk to a boardroom that closes the deal. The order portal keeps every Regal order on
              schedule, from the office to the factory floor.
            </p>

            <div className="mt-10 max-w-xl">
              <h2 className="text-sm font-semibold text-ink">Sign in to the order portal</h2>
              <RoleChooser className="mt-3" />
              <p className="mt-3 text-caption text-stone">Accounts are created by the office.</p>
            </div>
          </div>

          <div className="relative flex min-h-56 flex-col justify-end overflow-hidden bg-regal px-5 py-10 sm:px-8 lg:min-h-0 lg:justify-center lg:px-14">
            <HexOutline className="pointer-events-none absolute -right-48 -bottom-56 hidden size-[30rem] text-white/[0.09] lg:block" />
            <div className="relative">
              <Lockup tone="light" size="lg" className="hidden lg:inline-flex" />
              <p className="max-w-sm text-[1.75rem] leading-tight font-semibold tracking-tight text-white lg:mt-10 lg:text-[2rem]">
                Furniture, faithfully made.
              </p>
              <p className="mt-3 text-sm font-medium text-white/85">Homes · Schools · Offices</p>
            </div>
          </div>
        </section>

        <section id="about" aria-labelledby="about-title" className="scroll-mt-4 border-t border-line bg-canvas">
          <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <h2 id="about-title" className="text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-[2rem]">
                A house for every life stage.
              </h2>
              <p className="mt-4 leading-relaxed text-stone">
                Regal Furnitures is a Pakistani furniture house designing for homes, classrooms and offices. Every piece is crafted with
                patient skill, and each design carries the same promise: durability, comfort and timeless form.
              </p>
            </div>
            <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <div key={pillar.name} className="border-t border-line-strong pt-5">
                  <dt className="text-[1.0625rem] font-semibold tracking-tight text-ink">{pillar.name}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-stone">{pillar.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Brand mission band (brand book, page 2). */}
        <section aria-label="Our mission" className="bg-ink">
          <div className="mx-auto w-full max-w-7xl px-5 py-14 text-center sm:px-8 sm:py-16">
            <blockquote className="text-[1.5rem] leading-snug font-medium tracking-tight text-bone sm:text-[2rem]">
              &ldquo;To furnish Pakistan with pieces worth keeping.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-sidebar-muted">Our mission</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-caption text-stone sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© Regal Furnitures</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="https://regalpk.com" className="hover:text-ink" rel="noopener noreferrer" target="_blank">
              regalpk.com
            </a>
            <a href="mailto:regalfurnitures4@gmail.com" className="hover:text-ink">
              regalfurnitures4@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
