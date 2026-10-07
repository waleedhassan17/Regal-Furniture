import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/session"

/** Renders children only for admins. UI convenience only — the server and database enforce access. */
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <AdminGate fallback={fallback}>{children}</AdminGate>
    </Suspense>
  )
}

async function AdminGate({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const user = await getCurrentUser()
  return user?.isAdmin ? children : fallback
}
