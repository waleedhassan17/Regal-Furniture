import Link from "next/link"
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  Factory,
  History,
  LockKeyhole,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sofa,
  UserCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { loginHref } from "@/features/auth/roles"
import {
  FactoryViewVisual,
  FactoryVisual,
  OfficeViewVisual,
  RemindersVisual,
  SharingVisual,
} from "@/features/landing/components/feature-visuals"

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</div>
}

function SectionHeading({
  id,
  label,
  title,
  text,
  dark,
}: {
  id: string
  label?: string
  title: string
  text?: string
  dark?: boolean
}) {
  return (
    <div className="max-w-2xl">
      {label && <p className={cn("mb-4 text-sm font-semibold", dark ? "text-white/65" : "text-regal")}>{label}</p>}
      <h2
        id={id}
        className={cn(
          "text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[2.625rem]",
          dark ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      {text && (
        <p className={cn("mt-5 text-[1.0625rem] leading-relaxed text-pretty sm:text-[1.125rem]", dark ? "text-sidebar-muted" : "text-stone")}>
          {text}
        </p>
      )}
    </div>
  )
}

function CheckList({ points, className }: { points: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {points.map((point) => (
        <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-ink">
          <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink" />
          {point}
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: "Know what's late before the client calls",
    text: "The dashboard opens on what needs attention today, so nobody has to scroll a WhatsApp group to find out.",
    points: ["Overdue, due-soon and not-yet-started orders at a glance", "Reminder thresholds you control", "Every count opens the matching list"],
    visual: <RemindersVisual />,
  },
  {
    title: "Made for the factory floor",
    text: "Factory staff see what to make next and update progress from their phones — even on a slow connection.",
    points: ["Change status in two taps, with undo", "Item-by-item progress on every order", "Reference photos taken straight from the phone"],
    visual: <FactoryVisual />,
  },
  {
    title: "Job sheets and WhatsApp in one tap",
    text: "Print an A4 job sheet for the workshop, or share a clean order summary with the team.",
    points: ["Job sheets laid out like the factory's order book", "Plain-text WhatsApp summaries with a link back", "Prices never leave the office"],
    visual: <SharingVisual />,
  },
]

export function PlatformSection() {
  return (
    <section id="platform" aria-labelledby="platform-title" className="scroll-mt-20 bg-paper">
      <Container className="py-24 sm:py-32">
        <SectionHeading
          id="platform-title"
          label="Platform"
          title="Built around how Regal works"
          text="From the first call with a client to the final payment — one system the office and the factory both use."
        />
        <div className="mt-16 flex flex-col gap-20 sm:mt-20 sm:gap-28">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <h3 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink sm:text-[1.875rem]">
                  {feature.title}
                </h3>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-pretty text-stone">{feature.text}</p>
                <CheckList points={feature.points} className="mt-7" />
              </div>
              <div className={index % 2 === 1 ? "lg:order-1" : undefined}>{feature.visual}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ---------------------------------------------------------------------------

const CAPABILITIES = [
  { icon: Users, title: "Clients and history", text: "Every client's details and past orders in one place, with tap-to-call from any phone." },
  { icon: Wallet, title: "Payments and balances", text: "Record each payment and see what is still to collect. Visible to the office only." },
  { icon: Camera, title: "Item photos", text: "Reference photos taken on the phone, stored privately and printed on the job sheet." },
  { icon: MessageSquareText, title: "Notes log", text: "A running log on every order, showing who wrote each note and when." },
  { icon: Search, title: "Search and archive", text: "Find any order by client, phone, order or bill number. Archive finished work." },
  { icon: UserCog, title: "Team accounts", text: "Add people, choose their role, and switch off access the day they leave." },
]

export function CapabilitiesSection() {
  return (
    <section aria-labelledby="capabilities-title" className="border-y border-line bg-bone">
      <Container className="py-24 sm:py-28">
        <SectionHeading
          id="capabilities-title"
          title="Everything else, built in"
          text="The everyday details of the order book, kept together instead of scattered across chat threads."
        />
        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="bg-paper p-7 sm:p-8">
              <Icon aria-hidden="true" className="size-5 text-regal" />
              <h3 className="mt-5 text-[1.0625rem] font-semibold tracking-tight text-ink">{title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

// ---------------------------------------------------------------------------

const STEPS = [
  { who: "Office", title: "Enter the order", text: "Client, items with sizes and materials, deadline and amounts — in one form." },
  { who: "Factory", title: "Start production", text: "The team sees what is due and moves the order into production." },
  { who: "Factory", title: "Mark items ready", text: "Progress item by item, working from the printed job sheet." },
  { who: "Office", title: "Deliver and get paid", text: "Record payments and see what is still to collect." },
]

export function WorkflowSection() {
  return (
    <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-20 bg-paper">
      <Container className="py-24 sm:py-32">
        <SectionHeading
          id="workflow-title"
          label="How it works"
          title="From order to delivery"
          text="Every order follows the same clear path, and every step is recorded."
        />
        <ol className="mt-14 grid grid-cols-1 gap-10 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step, index) => {
            const WhoIcon = step.who === "Office" ? Building2 : Factory
            return (
              <li key={step.title}>
                <div className="flex items-center gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white tabular">
                    {index + 1}
                  </span>
                  {index < STEPS.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-line-strong lg:block" />}
                </div>
                <p className="mt-6 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-stone">
                  <WhoIcon aria-hidden="true" className="size-3.5" />
                  {step.who}
                </p>
                <h3 className="mt-2 text-[1.1875rem] font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone">{step.text}</p>
              </li>
            )
          })}
        </ol>
      </Container>
    </section>
  )
}

// ---------------------------------------------------------------------------

const ROLE_CARDS = [
  {
    role: "admin" as const,
    title: "For the office",
    text: "Owners and office staff run orders, clients and money.",
    points: ["Create and edit orders with photos", "Clients, payments and balances", "Team accounts and reminder settings", "Archive and restore orders"],
    cta: "Sign in as Office & admin",
    visual: <OfficeViewVisual />,
  },
  {
    role: "staff" as const,
    title: "For the factory",
    text: "Workshop staff see the work and report progress — never the money.",
    points: ["Today's priorities on the dashboard", "Update order and item status", "Add notes and see reference photos", "Print job sheets"],
    cta: "Sign in as Factory staff",
    visual: <FactoryViewVisual />,
  },
]

export function RolesSection() {
  return (
    <section aria-labelledby="roles-title" className="border-y border-line bg-bone">
      <Container className="py-24 sm:py-32">
        <SectionHeading
          id="roles-title"
          title="One portal, two clear roles"
          text="The same order, seen two ways. The office sets each person's role, and the database enforces it."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-0">
          {ROLE_CARDS.map((card) => (
            <div
              key={card.role}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper lg:row-span-2 lg:grid lg:grid-rows-subgrid"
            >
              <div aria-hidden="true" className="border-b border-line bg-canvas p-5 select-none sm:p-8">
                {card.visual}
              </div>
              <div className="flex flex-1 flex-col p-7 sm:p-8">
                <h3 className="text-[1.375rem] font-semibold tracking-tight text-ink">{card.title}</h3>
                <p className="mt-2 text-stone">{card.text}</p>
                <CheckList points={card.points} className="mt-6 flex-1" />
                <Link
                  href={loginHref(card.role)}
                  className="mt-8 inline-flex items-center gap-2 self-start text-sm font-semibold text-regal underline-offset-4 hover:text-crimson hover:underline"
                >
                  {card.cta} <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ---------------------------------------------------------------------------

const SECURITY = [
  { icon: ShieldCheck, title: "Role-based access", text: "Factory staff never see amounts or payments. The database enforces it, not just the screen." },
  { icon: History, title: "Every change recorded", text: "Status history shows who changed what, and when — it can't be skipped or edited." },
  { icon: LockKeyhole, title: "Private photos", text: "Reference photos are stored privately and shown through short-lived links." },
  { icon: UserCheck, title: "Accounts run by the office", text: "Admins add and remove people. A deactivated account loses access immediately." },
]

export function SecuritySection() {
  return (
    <section id="security" aria-labelledby="security-title" className="scroll-mt-20 bg-ink">
      <Container className="py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <SectionHeading
            dark
            id="security-title"
            label="Security"
            title="Secure by design"
            text="Regal's orders, clients and payments stay with the people who need them. The access rules live in the database itself, so they hold on every screen and every device."
          />
          <ul className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar-border sm:grid-cols-2">
            {SECURITY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="bg-ink p-7">
                <Icon aria-hidden="true" className="size-5 text-bone" />
                <h3 className="mt-5 text-[1.0625rem] font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-sidebar-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

// ---------------------------------------------------------------------------

/** Brand pillars, worded as in the Regal brand book (page 2). */
const PILLARS = [
  { name: "Craft", text: "Joinery and finish that outlast trends." },
  { name: "Versatility", text: "One brand for home, school and office." },
  { name: "Accessible", text: "Premium feel, locally-made value." },
  { name: "Enduring", text: "Built to be inherited, not replaced." },
]

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 bg-paper">
      <Container className="py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
          <div>
            <SectionHeading id="about-title" label="About Regal" title="A house for every life stage." />
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-stone">
              Regal Furnitures is a Pakistani furniture house designing for homes, classrooms and offices. From a child&apos;s first
              study desk to a boardroom that closes the deal, every piece is crafted with patient skill — and carries the same
              promise: durability, comfort and timeless form.
            </p>
            <p className="mt-7 flex items-center gap-2 text-sm font-semibold text-ink">
              <Sofa aria-hidden="true" className="size-4 text-stone" />
              Homes · Schools · Offices
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-10 gap-y-9 self-center sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div key={pillar.name} className="border-t border-line-strong pt-5">
                <dt className="text-[1.125rem] font-semibold tracking-tight text-ink">{pillar.name}</dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-stone">{pillar.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="mt-20 border-t border-line pt-16 text-center sm:mt-28 sm:pt-20">
          <blockquote className="mx-auto max-w-3xl text-[1.75rem] leading-snug font-medium tracking-[-0.02em] text-balance text-ink sm:text-[2.5rem]">
            &ldquo;To furnish Pakistan with pieces worth keeping.&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-sm font-medium text-stone">The Regal mission</figcaption>
        </figure>
      </Container>
    </section>
  )
}
