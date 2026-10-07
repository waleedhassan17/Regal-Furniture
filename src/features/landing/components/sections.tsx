import Link from "next/link"
import {
  ArrowRight,
  Bell,
  Check,
  ClipboardList,
  FileText,
  History,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sofa,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import { Pill } from "@/components/data/status-badge"
import { loginHref } from "@/features/auth/roles"
import { FactoryVisual, RemindersVisual, SharingVisual } from "@/features/landing/components/feature-visuals"

function SectionHeading({ id, title, text, center }: { id: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 id={id} className="text-[1.875rem] leading-tight font-semibold tracking-tight text-ink sm:text-[2.25rem]">
        {title}
      </h2>
      {text && <p className="mt-4 text-[1.0625rem] leading-relaxed text-stone">{text}</p>}
    </div>
  )
}

function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className ?? ""}`}>{children}</div>
}

// ---------------------------------------------------------------------------

const CAPABILITIES = [
  { icon: ClipboardList, label: "Orders and items" },
  { icon: Users, label: "Clients" },
  { icon: Bell, label: "Deadline reminders" },
  { icon: Wallet, label: "Payments" },
  { icon: FileText, label: "Job sheets" },
  { icon: MessageCircle, label: "WhatsApp sharing" },
]

export function CapabilityStrip() {
  return (
    <section aria-label="What the portal covers" className="border-y border-line bg-canvas">
      <Container className="py-8">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium text-ink">
              <Icon aria-hidden="true" className="size-[18px] shrink-0 text-stone" />
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
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
      <Container className="py-20 sm:py-24">
        <SectionHeading
          id="platform-title"
          title="Built around how Regal works"
          text="From the first call with a client to the final payment — one system the office and the factory both use."
        />
        <div className="mt-16 flex flex-col gap-20 sm:gap-24">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <h3 className="text-[1.5rem] leading-snug font-semibold tracking-tight text-ink">{feature.title}</h3>
                <p className="mt-3 leading-relaxed text-stone">{feature.text}</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-ink">
                      <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--st-done-dot)]" />
                      {point}
                    </li>
                  ))}
                </ul>
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

const STEPS = [
  { who: "Office", title: "Enter the order", text: "Client, items with sizes and materials, deadline and amounts — in one form." },
  { who: "Factory", title: "Start production", text: "The team sees what is due and moves the order into production." },
  { who: "Factory", title: "Mark items ready", text: "Progress item by item, working from the printed job sheet." },
  { who: "Office", title: "Deliver and get paid", text: "Record payments and see what is still to collect." },
]

export function WorkflowSection() {
  return (
    <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-20 border-y border-line bg-canvas">
      <Container className="py-20 sm:py-24">
        <SectionHeading id="workflow-title" title="From order to delivery" text="Every order follows the same clear path, and every step is recorded." />
        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-line bg-paper p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-ink tabular">
                  {index + 1}
                </span>
                <Pill tone={step.who === "Office" ? "track" : "progress"} size="sm" dot={false}>
                  {step.who}
                </Pill>
              </div>
              <h3 className="mt-5 text-[1.0625rem] font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{step.text}</p>
            </li>
          ))}
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
  },
  {
    role: "staff" as const,
    title: "For the factory",
    text: "Workshop staff see the work and report progress — never the money.",
    points: ["Today's priorities on the dashboard", "Update order and item status", "Add notes and see reference photos", "Print job sheets"],
    cta: "Sign in as Factory staff",
  },
]

export function RolesSection() {
  return (
    <section aria-labelledby="roles-title" className="bg-paper">
      <Container className="py-20 sm:py-24">
        <SectionHeading id="roles-title" title="One portal, two clear roles" text="Everyone sees exactly what they need. Roles are set by the office on each account." />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ROLE_CARDS.map((card) => (
            <div key={card.role} className="flex flex-col rounded-2xl border border-line bg-paper p-7 sm:p-8">
              <h3 className="text-[1.375rem] font-semibold tracking-tight text-ink">{card.title}</h3>
              <p className="mt-2 text-stone">{card.text}</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-line pt-6">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-ink">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-stone" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={loginHref(card.role)}
                className="mt-8 inline-flex items-center gap-2 self-start text-sm font-semibold text-regal underline-offset-4 hover:text-crimson hover:underline"
              >
                {card.cta} <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
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
    <section id="security" aria-labelledby="security-title" className="scroll-mt-20 border-t border-line bg-canvas">
      <Container className="py-20 sm:py-24">
        <SectionHeading id="security-title" title="Secure by design" text="Regal's orders, clients and payments stay with the people who need them." />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-line bg-paper p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-subtle">
                <Icon aria-hidden="true" className="size-[18px] text-ink" />
              </span>
              <h3 className="mt-5 text-[1rem] font-semibold tracking-tight text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{text}</p>
            </div>
          ))}
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
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 border-t border-line bg-paper">
      <Container className="py-20 sm:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <h2 id="about-title" className="text-[1.875rem] leading-tight font-semibold tracking-tight text-ink sm:text-[2.25rem]">
              A house for every life stage.
            </h2>
            <p className="mt-5 leading-relaxed text-stone">
              Regal Furnitures is a Pakistani furniture house designing for homes, classrooms and offices. From a child&apos;s first
              study desk to a boardroom that closes the deal, every piece is crafted with patient skill — and carries the same
              promise: durability, comfort and timeless form.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
              <Sofa aria-hidden="true" className="size-4 text-stone" />
              Homes · Schools · Offices
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div key={pillar.name} className="border-t border-line-strong pt-5">
                <dt className="text-[1.0625rem] font-semibold tracking-tight text-ink">{pillar.name}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-stone">{pillar.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  )
}

export function MissionBand() {
  return (
    <section aria-label="Our mission" className="bg-ink">
      <Container className="py-16 text-center sm:py-20">
        <blockquote className="mx-auto max-w-3xl text-[1.625rem] leading-snug font-medium tracking-tight text-bone sm:text-[2.25rem]">
          &ldquo;To furnish Pakistan with pieces worth keeping.&rdquo;
        </blockquote>
        <p className="mt-5 text-sm text-sidebar-muted">The Regal mission</p>
      </Container>
    </section>
  )
}
