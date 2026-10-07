import type { Metadata } from "next"
import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/format/date"
import { PageHeader } from "@/components/shell/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getSettings } from "@/features/settings/queries"
import { SettingsForm } from "@/features/settings/components/settings-form"

export const metadata: Metadata = { title: "Reminder settings" }

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Reminder settings"
        description="These decide when an order shows up on the dashboard as needing attention. Changes apply to every order straight away."
      />
      <Suspense fallback={<div className="flex max-w-3xl flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}</div>}>
        <Settings />
      </Suspense>
    </>
  )
}

async function Settings() {
  await requireAdmin()
  const settings = await getSettings()
  return (
    <>
      <SettingsForm initial={settings} />
      {settings.updatedAt && <p className="mt-4 text-caption text-stone">Last changed {formatDateTime(settings.updatedAt)}</p>}
    </>
  )
}
