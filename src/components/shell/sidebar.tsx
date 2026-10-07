"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Lockup, Mark } from "@/components/brand/logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NAV_ITEMS, isActive } from "@/components/shell/nav-items"
import type { ShellUser } from "@/components/shell/types"

/**
 * Desktop navigation. Ink surface (brand: "Ink anchors"). Shows a compact rail with the
 * mark between 1024–1279px and the full sidebar with the lockup from 1280px.
 */
export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.isAdmin)

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-(--sidebar-width-collapsed) flex-col bg-sidebar text-sidebar-foreground lg:flex xl:w-(--sidebar-width)"
    >
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-3 xl:justify-start xl:px-6">
        <Link href="/dashboard" className="rounded-md focus-visible:outline-sidebar-ring" aria-label="Regal Furnitures — dashboard">
          <span className="xl:hidden">
            <Mark tone="light" size={40} />
          </span>
          <span className="hidden xl:block">
            <Lockup tone="light" className="max-w-[10.5rem]" />
          </span>
        </Link>
      </div>

      {user.isAdmin && (
        <div className="px-3 pt-5 xl:px-4">
          <RailTooltip label="New order">
            <Link
              href="/orders/new"
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-regal text-sm font-semibold text-white transition-colors duration-(--duration-fast) hover:bg-crimson focus-visible:outline-sidebar-ring"
            >
              <Plus aria-hidden="true" className="size-[18px]" />
              <span className="sr-only xl:not-sr-only">New order</span>
            </Link>
          </RailTooltip>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-5 xl:px-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item, pathname)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <RailTooltip label={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center justify-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-(--duration-fast) focus-visible:outline-sidebar-ring xl:justify-start",
                      active
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                    <span className="sr-only xl:not-sr-only">{item.label}</span>
                  </Link>
                </RailTooltip>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3 xl:p-4">
        <div className="hidden items-center gap-3 px-2 pb-3 xl:flex">
          <Initials name={user.fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
            <p className="text-caption text-sidebar-muted">{user.isAdmin ? "Admin" : "Staff"}</p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <RailTooltip label="Sign out">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md px-3 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-white focus-visible:outline-sidebar-ring xl:justify-start"
            >
              <LogOut aria-hidden="true" className="size-[18px]" />
              <span className="sr-only xl:not-sr-only">Sign out</span>
            </button>
          </RailTooltip>
        </form>
      </div>
    </aside>
  )
}

/** Tooltip only matters in the compact rail, where labels are hidden. */
function RailTooltip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="xl:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-walnut text-[0.75rem] font-bold text-bone",
        className
      )}
    >
      {initials || "?"}
    </span>
  )
}
