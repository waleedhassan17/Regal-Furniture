import { AppShell } from "@/components/shell/app-shell"

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>
}
