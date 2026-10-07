"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ATTENTION_LABEL, ATTENTION_LEVELS, PRODUCTION_STATUSES, PRODUCTION_STATUS_LABEL } from "@/lib/domain/status"
import { formatDate } from "@/lib/format/date"
import { ORDER_SORTS } from "@/features/orders/schema"
import type { TeamMemberOption } from "@/features/orders/queries"

type FilterKey = "status" | "attention" | "responsible" | "from" | "to" | "archived" | "sort" | "delivered"

/** Search box + filters, all stored in the URL so a filtered list can be shared and survives refresh. */
export function OrderFilters({ team, isAdmin }: { team: TeamMemberOption[]; isAdmin: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [sheetOpen, setSheetOpen] = useState(false)
  const lastPushed = useRef(params.get("q") ?? "")

  function navigate(update: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString())
    update(next)
    next.delete("page")
    const query = next.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  function setParam(key: FilterKey | "q", value: string) {
    navigate((next) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
  }

  // Debounced search.
  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed === lastPushed.current) return
    const id = setTimeout(() => {
      lastPushed.current = trimmed
      setParam("q", trimmed)
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setParam reads the latest params on each call
  }, [q])

  // Keep the box in sync when the URL changes elsewhere (e.g. "Clear all").
  const urlQ = params.get("q") ?? ""
  useEffect(() => {
    if (urlQ !== lastPushed.current) {
      lastPushed.current = urlQ
      setQ(urlQ)
    }
  }, [urlQ])

  const chips = activeChips(params, team)
  const filterCount = chips.length

  const filterFields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterSelect label="Status" id="f-status" value={params.get("status") ?? ""} onChange={(v) => setParam("status", v)}>
        <option value="">Open orders</option>
        <option value="all">All statuses</option>
        {PRODUCTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PRODUCTION_STATUS_LABEL[s]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Attention" id="f-attention" value={params.get("attention") ?? ""} onChange={(v) => setParam("attention", v)}>
        <option value="">Any</option>
        {ATTENTION_LEVELS.map((a) => (
          <option key={a} value={a}>
            {ATTENTION_LABEL[a]}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Person responsible" id="f-responsible" value={params.get("responsible") ?? ""} onChange={(v) => setParam("responsible", v)}>
        <option value="">Anyone</option>
        <option value="none">Not assigned</option>
        {team.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Sort by" id="f-sort" value={params.get("sort") ?? ""} onChange={(v) => setParam("sort", v === "deadline" ? "" : v)}>
        {Object.entries(ORDER_SORTS).map(([value, label]) => (
          <option key={value} value={value === "deadline" ? "" : value}>
            {label}
          </option>
        ))}
      </FilterSelect>
      <div className="flex flex-col gap-2">
        <Label htmlFor="f-from">Deadline from</Label>
        <Input id="f-from" type="date" value={params.get("from") ?? ""} onChange={(e) => setParam("from", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="f-to">Deadline to</Label>
        <Input id="f-to" type="date" min={params.get("from") ?? undefined} value={params.get("to") ?? ""} onChange={(e) => setParam("to", e.target.value)} />
      </div>
      {isAdmin && (
        <FilterSelect label="Archived orders" id="f-archived" value={params.get("archived") ?? ""} onChange={(v) => setParam("archived", v)}>
          <option value="">Hide archived</option>
          <option value="include">Include archived</option>
          <option value="only">Only archived</option>
        </FilterSelect>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, phone, order no."
            aria-label="Search orders"
            className="pr-10 pl-10"
          />
          {pending && <Spinner className="absolute top-1/2 right-3.5 -translate-y-1/2 text-stone" />}
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden" aria-label={`Filters${filterCount ? ` (${filterCount} active)` : ""}`}>
              <SlidersHorizontal aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              {filterCount > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-ink text-[0.6875rem] text-bone tabular">{filterCount}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filter orders</SheetTitle>
              <SheetDescription>Changes apply straight away.</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto p-5">{filterFields}</div>
            <SheetFooter className="flex-row">
              <Button variant="ghost" className="flex-1" onClick={() => navigate((next) => clearFilters(next))} disabled={filterCount === 0}>
                Clear filters
              </Button>
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                Show orders
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden rounded-xl border border-sand bg-card p-4 lg:block">{filterFields}</div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => navigate((next) => chip.keys.forEach((k) => next.delete(k)))}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-sand-strong bg-paper pr-2 pl-3 text-caption font-semibold text-ink hover:bg-sand-soft"
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <X aria-hidden="true" className="size-3.5 text-stone" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate((next) => clearFilters(next))}
            className="h-8 px-2 text-caption font-semibold text-regal underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function clearFilters(next: URLSearchParams) {
  for (const key of ["status", "attention", "responsible", "from", "to", "archived", "delivered", "q", "sort"]) next.delete(key)
}

function FilterSelect({
  label,
  id,
  value,
  onChange,
  children,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(value && "border-ink/60")}>
        {children}
      </NativeSelect>
    </div>
  )
}

function activeChips(params: URLSearchParams, team: TeamMemberOption[]) {
  const chips: { key: string; label: string; keys: string[] }[] = []
  const status = params.get("status")
  if (status === "all") chips.push({ key: "status", label: "All statuses", keys: ["status"] })
  else if (status && status in PRODUCTION_STATUS_LABEL)
    chips.push({ key: "status", label: PRODUCTION_STATUS_LABEL[status as keyof typeof PRODUCTION_STATUS_LABEL], keys: ["status", "delivered"] })
  if (params.get("delivered") === "this-month") chips.push({ key: "delivered", label: "Delivered this month", keys: ["delivered"] })
  const attention = params.get("attention")
  if (attention && attention in ATTENTION_LABEL) chips.push({ key: "attention", label: ATTENTION_LABEL[attention as keyof typeof ATTENTION_LABEL], keys: ["attention"] })
  const responsible = params.get("responsible")
  if (responsible)
    chips.push({
      key: "responsible",
      label: responsible === "none" ? "Not assigned" : (team.find((p) => p.id === responsible)?.full_name ?? "Someone"),
      keys: ["responsible"],
    })
  const from = params.get("from")
  const to = params.get("to")
  if (from || to)
    chips.push({
      key: "range",
      label: from && to ? `Due ${formatDate(from)} – ${formatDate(to)}` : from ? `Due from ${formatDate(from)}` : `Due by ${formatDate(to)}`,
      keys: ["from", "to"],
    })
  const archived = params.get("archived")
  if (archived) chips.push({ key: "archived", label: archived === "only" ? "Archived only" : "Including archived", keys: ["archived"] })
  return chips
}
