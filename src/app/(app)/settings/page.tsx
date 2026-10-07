import type { Metadata } from "next"
import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/format/date"
import { PageHeader } from "@/components/shell/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getSettings } from "@/features/settings/queries"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { getCompany } from "@/features/company/queries"
import { CompanyForm } from "@/features/company/components/company-form"

export const metadata: Metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your company details and when orders are flagged as needing attention." />
      <Suspense fallback={<div className="flex max-w-3xl flex-col gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>}>
        <Settings />
      </Suspense>
    </>
  )
}

async function Settings() {
  await requireAdmin()
  const [settings, company] = await Promise.all([getSettings(), getCompany()])
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section aria-labelledby="company-title" className="flex flex-col gap-4">
        <div>
          <h2 id="company-title" className="text-[1.0625rem] font-semibold tracking-tight text-ink">
            Company
          </h2>
          <p className="mt-1 text-sm text-stone">Shown on job sheets.</p>
        </div>
        <CompanyForm
          initial={{
            company_name: company?.name ?? "Regal Furnitures",
            company_phone: company?.phone ?? "",
            company_email: company?.email ?? "",
            company_address: company?.address ?? "",
            company_city: company?.city ?? "",
            company_website: company?.website ?? "",
          }}
        />
      </section>

      <section aria-labelledby="reminders-title" className="flex flex-col gap-4">
        <div>
          <h2 id="reminders-title" className="text-[1.0625rem] font-semibold tracking-tight text-ink">
            Reminders
          </h2>
          <p className="mt-1 text-sm text-stone">
            These decide when an order appears on the dashboard as needing attention. Changes apply to every order straight away.
          </p>
        </div>
        <SettingsForm initial={settings} />
        {settings.updatedAt && <p className="text-caption text-stone">Reminders last changed {formatDateTime(settings.updatedAt)}</p>}
      </section>
    </div>
  )
}
