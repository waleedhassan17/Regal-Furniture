import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/data/empty-state"

export default function Forbidden() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        icon={ShieldAlert}
        title="This page is for admins"
        description="Your account doesn't have access to this page. If you need it, ask an admin at Regal."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to the dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
