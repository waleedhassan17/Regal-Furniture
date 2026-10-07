"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/data/empty-state"

/** Friendly fallback for unexpected errors inside the portal. Details go to the console/server logs only. */
export default function PortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={
          <>
            This page didn&apos;t load properly. It&apos;s usually a brief connection problem — try again in a moment.
            {error.digest && <span className="mt-2 block text-caption">Reference: {error.digest}</span>}
          </>
        }
        action={
          <>
            <Button onClick={() => retry()}>
              <RotateCcw aria-hidden="true" /> Try again
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Go to the dashboard</Link>
            </Button>
          </>
        }
      />
    </div>
  )
}
