import Link from "next/link"
import { Button } from "@/components/ui/button"
import { isRegistrationOpen } from "@/features/company/queries"

type Variant = "nav" | "hero" | "band"

/**
 * "Register company" shows only while the one-time registration is still open.
 * Rendered behind Suspense: it checks the database at request time.
 */
export async function RegistrationCta({ variant }: { variant: Variant }) {
  const open = await isRegistrationOpen()
  if (variant === "nav") {
    // While registration is open, "Register company" is the main action; afterwards, "Sign in" is.
    return open ? (
      <>
        {/* On phones the hero's large Sign in button sits right below; keep the bar to one action. */}
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Register company</Link>
        </Button>
      </>
    ) : (
      <Button asChild size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    )
  }
  if (!open) return null
  if (variant === "band") {
    return (
      <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10">
        <Link href="/register">Register your company</Link>
      </Button>
    )
  }
  return (
    <Button asChild size="lg" variant="outline">
      <Link href="/register">Register your company</Link>
    </Button>
  )
}
