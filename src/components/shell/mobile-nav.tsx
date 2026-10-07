"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, LayoutDashboard, LogOut, Menu, Plus, SlidersHorizontal, UserCog, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Wordmark } from "@/components/brand/logo"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Initials } from "@/components/shell/sidebar"
import type { ShellUser } from "@/components/shell/types"

/** Phone and tablet header: wordmark only, so content starts high on small screens. */
export function MobileTopBar() {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <Link href="/dashboard" aria-label="Regal Furnitures — dashboard" className="rounded-md">
        <Wordmark className="scale-[0.8] origin-left" />
      </Link>
    </div>
  )
}

/** Bottom tab bar for phones (≥44px targets, respects the home-indicator safe area). */
export function BottomNav({ user }: { user: ShellUser }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard, active: pathname === "/dashboard" },
    {
      href: "/orders",
      label: "Orders",
      icon: ClipboardList,
      active: pathname === "/orders" || (pathname.startsWith("/orders/") && pathname !== "/orders/new"),
    },
    { href: "/clients", label: "Clients", icon: Users, active: pathname.startsWith("/clients") },
  ]

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex h-(--bottom-nav-height) max-w-xl items-stretch justify-around px-1">
          {tabs.slice(0, 2).map((tab) => (
            <Tab key={tab.href} {...tab} />
          ))}
          {user.isAdmin && (
            <li className="flex flex-1 items-center justify-center">
              <Link
                href="/orders/new"
                aria-label="New order"
                aria-current={pathname === "/orders/new" ? "page" : undefined}
                className="flex size-12 items-center justify-center rounded-full bg-regal text-white shadow-(--shadow-raised) transition-colors hover:bg-crimson active:bg-crimson"
              >
                <Plus aria-hidden="true" className="size-6" />
              </Link>
            </li>
          )}
          <Tab {...tabs[2]} />
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-md text-[0.6875rem] font-semibold text-stone",
                (pathname.startsWith("/team") || pathname.startsWith("/settings")) && "text-ink"
              )}
            >
              <Menu aria-hidden="true" className="size-5" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Initials name={user.fullName} />
              <div className="min-w-0 text-left">
                <SheetTitle className="truncate text-[1.125rem]">{user.fullName}</SheetTitle>
                <SheetDescription className="truncate">
                  {user.isAdmin ? "Admin" : "Staff"} · {user.email}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-3">
            {user.isAdmin && (
              <>
                <SheetLink href="/team" icon={UserCog} label="Team" onNavigate={() => setMoreOpen(false)} />
                <SheetLink href="/settings" icon={SlidersHorizontal} label="Reminder settings" onNavigate={() => setMoreOpen(false)} />
              </>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-regal hover:bg-subtle"
              >
                <LogOut aria-hidden="true" className="size-5" />
                Sign out
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Users; active: boolean }) {
  return (
    <li className="flex flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-md text-[0.6875rem] font-medium transition-colors",
          active ? "text-ink font-semibold" : "text-stone"
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
        {label}
      </Link>
    </li>
  )
}

function SheetLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string
  icon: typeof Users
  label: string
  onNavigate: () => void
}) {
  return (
    <Link href={href} onClick={onNavigate} className="flex h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold text-ink hover:bg-subtle">
      <Icon aria-hidden="true" className="size-5 text-stone" />
      {label}
    </Link>
  )
}
