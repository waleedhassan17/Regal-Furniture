import { Suspense } from "react"
import { requireUser } from "@/lib/auth/session"
import { Sidebar } from "@/components/shell/sidebar"
import { BottomNav, MobileTopBar } from "@/components/shell/mobile-nav"
import { Skeleton } from "@/components/ui/skeleton"

/** Signed-in frame. Navigation depends on the user's role, so it streams behind Suspense. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-(--sidebar-width-collapsed) xl:pl-(--sidebar-width)">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-bone focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Suspense fallback={<NavFallback />}>
        <Navigation />
      </Suspense>
      <MobileTopBar />
      <main
        id="main"
        className="mx-auto w-full max-w-[88rem] px-4 pt-6 pb-[calc(var(--bottom-nav-height)+2.5rem)] sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
      >
        {children}
      </main>
    </div>
  )
}

async function Navigation() {
  const user = await requireUser()
  const shellUser = { fullName: user.fullName, email: user.email, isAdmin: user.isAdmin }
  return (
    <>
      <Sidebar user={shellUser} />
      <BottomNav user={shellUser} />
    </>
  )
}

function NavFallback() {
  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width-collapsed) bg-sidebar lg:block xl:w-(--sidebar-width)">
        <div className="flex flex-col gap-2 px-4 pt-28">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 bg-sidebar-accent" />
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 h-(--bottom-nav-height) border-t border-sand bg-paper lg:hidden" />
    </>
  )
}
