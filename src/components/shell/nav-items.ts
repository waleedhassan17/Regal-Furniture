import { LayoutDashboard, ClipboardList, Users, UserCog, SlidersHorizontal, type LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
  /** Also active for nested routes (e.g. /orders/123). */
  matchPrefix?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList, matchPrefix: true },
  { href: "/clients", label: "Clients", icon: Users, matchPrefix: true },
  { href: "/team", label: "Team", icon: UserCog, adminOnly: true },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal, adminOnly: true },
]

export function isActive(item: NavItem, pathname: string) {
  if (item.href === "/orders" && pathname === "/orders/new") return false
  return pathname === item.href || (item.matchPrefix === true && pathname.startsWith(`${item.href}/`))
}
