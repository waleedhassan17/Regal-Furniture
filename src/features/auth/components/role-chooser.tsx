import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import { SIGN_IN_ROLES, loginHref, type SignInRole } from "@/features/auth/roles"

const ICON: Record<SignInRole, typeof Hammer> = {
  admin: BriefcaseBusiness,
  staff: Hammer,
}

type RoleChooserProps = {
  next?: string | null
  /** "grid" puts the two choices side by side on wider screens; "stack" always stacks them. */
  layout?: "grid" | "stack"
  className?: string
}

/** The first step of signing in: choose whether you are office/admin or factory staff. */
export function RoleChooser({ next, layout = "grid", className }: RoleChooserProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3", layout === "grid" && "sm:grid-cols-2", className)}>
      {SIGN_IN_ROLES.map((role) => {
        const Icon = ICON[role.value]
        return (
          <li key={role.value}>
            <Link
              href={loginHref(role.value, next)}
              className="group flex h-full items-start gap-4 rounded-xl border border-line bg-paper p-5 transition-colors duration-(--duration-fast) hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-subtle">
                <Icon aria-hidden="true" className="size-[18px] text-ink" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[1rem] font-semibold tracking-tight text-ink">{role.title}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-stone transition-transform duration-(--duration-base) group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-stone">{role.description}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
