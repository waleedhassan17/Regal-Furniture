import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Lockup } from "@/components/brand/logo"
import { HexOutline } from "@/components/brand/hexagon"
import { Button } from "@/components/ui/button"
import { ProductPreview } from "@/features/landing/components/product-preview"
import { RegistrationCta } from "@/features/landing/components/registration-cta"
import {
  AboutSection,
  CapabilityStrip,
  MissionBand,
  PlatformSection,
  RolesSection,
  SecuritySection,
  WorkflowSection,
} from "@/features/landing/components/sections"

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "#workflow", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#about", label: "About Regal" },
]

/** Public home page: what the portal does, Regal's brand, and the ways in. */
export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <CapabilityStrip />
        <PlatformSection />
        <WorkflowSection />
        <RolesSection />
        <SecuritySection />
        <AboutSection />
        <MissionBand />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-backdrop-filter:bg-paper/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Regal Furnitures — home" className="shrink-0 rounded-md">
          <Lockup priority className="max-w-[8.5rem]" />
        </Link>
        <nav aria-label="Site" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-stone transition-colors hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Suspense
            fallback={
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            }
          >
            <RegistrationCta variant="nav" />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-paper">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-stone">Regal Furnitures · Order management</p>
          <h1 id="hero-title" className="mt-5 text-[2.375rem] leading-[1.06] font-semibold tracking-[-0.035em] text-ink sm:text-[3.25rem]">
            Furniture, faithfully made.
            <span className="block text-stone">Orders, faithfully delivered.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[1.125rem] leading-relaxed text-stone">
            The order portal for Regal Furnitures. Plan, track and deliver orders for homes, schools and offices — with deadline
            reminders for the office and simple progress updates for the factory floor.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Sign in <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Suspense fallback={null}>
              <RegistrationCta variant="hero" />
            </Suspense>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone">
            {["Role-based access", "Works on any phone", "Every change recorded"].map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-ink" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <ProductPreview />
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-regal">
      <HexOutline className="pointer-events-none absolute -top-40 -right-24 hidden size-[28rem] text-white/[0.08] sm:block" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 id="cta-title" className="text-[1.875rem] leading-tight font-semibold tracking-tight text-white sm:text-[2.25rem]">
            Bring every order into one place.
          </h2>
          <p className="mt-3 text-[1.0625rem] text-white/90">Sign in to the portal, or register Regal Furnitures if you&apos;re setting it up.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="outline" className="border-white bg-white text-ink hover:border-white hover:bg-bone">
            <Link href="/login">
              Sign in <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Suspense fallback={null}>
            <RegistrationCta variant="band" />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  const columns: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: "Portal",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/register", label: "Register company" },
        { href: "/forgot-password", label: "Forgot password" },
      ],
    },
    {
      title: "Platform",
      links: [
        { href: "#platform", label: "Features" },
        { href: "#workflow", label: "How it works" },
        { href: "#security", label: "Security" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "#about", label: "About Regal" },
        { href: "https://regalpk.com", label: "regalpk.com", external: true },
        { href: "mailto:regalfurnitures4@gmail.com", label: "regalfurnitures4@gmail.com" },
      ],
    },
  ]
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-xs">
          <Lockup className="max-w-[8.5rem]" />
          <p className="mt-4 text-sm leading-relaxed text-stone">Furniture for the way Pakistan lives, studies and works.</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-ink">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm break-all text-stone transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-caption text-stone sm:flex-row sm:justify-between sm:px-8">
          <p>© Regal Furnitures. All rights reserved.</p>
          <p>Order management portal · Internal use</p>
        </div>
      </div>
    </footer>
  )
}
