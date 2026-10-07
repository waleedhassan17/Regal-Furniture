import type { Metadata } from "next"
import Link from "next/link"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/data/empty-state"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4">
      <EmptyState
        icon={SearchX}
        title="We couldn't find that page"
        description="The link may be old, or the order may have been archived. Check the address or head back to the dashboard."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to the dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
