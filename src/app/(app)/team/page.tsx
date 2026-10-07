import type { Metadata } from "next"
import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth/session"
import { PageHeader } from "@/components/shell/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { listTeam } from "@/features/team/queries"
import { TeamManager } from "@/features/team/components/team-manager"

export const metadata: Metadata = { title: "Team" }

export default function TeamPage() {
  return (
    <>
      <PageHeader eyebrow="Team" title="Team" description="Everyone who can sign in to the portal. Add people, change their role, or remove their access." />
      <Suspense fallback={<div className="flex flex-col gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>}>
        <Team />
      </Suspense>
    </>
  )
}

async function Team() {
  const user = await requireAdmin()
  const members = await listTeam()
  return <TeamManager members={members} currentUserId={user.id} />
}
