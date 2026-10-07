import type { Metadata } from "next"
import { PageHeader } from "@/components/shell/page-header"

export const metadata: Metadata = { title: "Dashboard" }

export default function DashboardPage() {
  return <PageHeader eyebrow="Today" title="Dashboard" description="The factory at a glance." />
}
