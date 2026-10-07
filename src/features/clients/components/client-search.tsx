"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function ClientSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [pending, startTransition] = useTransition()
  const last = useRef(params.get("q") ?? "")

  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed === last.current) return
    const id = setTimeout(() => {
      last.current = trimmed
      const next = new URLSearchParams()
      if (trimmed) next.set("q", trimmed)
      startTransition(() => router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false }))
    }, 300)
    return () => clearTimeout(id)
  }, [q, pathname, router])

  return (
    <div className="relative max-w-xl">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone" />
      <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, company or city" aria-label="Search clients" className="pr-10 pl-10" />
      {pending && <Spinner className="absolute top-1/2 right-3.5 -translate-y-1/2 text-stone" />}
    </div>
  )
}
