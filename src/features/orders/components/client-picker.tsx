"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, MapPin, Phone, Plus, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ClientForm } from "@/features/clients/components/client-form"
import { createClientAction, searchClientsAction } from "@/features/clients/actions"
import type { ClientOption } from "@/features/clients/queries"

type ClientPickerProps = {
  id: string
  value: ClientOption | null
  onChange: (client: ClientOption) => void
  invalid?: boolean
  describedBy?: string
}

/** Search existing clients by name, company or phone, or add a new one without leaving the order. */
export function ClientPicker({ id, value, onChange, invalid, describedBy }: ClientPickerProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ q: string; options: ClientOption[]; error: string | null } | null>(null)
  const debounced = useDebouncedValue(query, 250)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    searchClientsAction({ q: debounced }).then((result) => {
      if (cancelled) return
      setResults(result.ok ? { q: debounced, options: result.data, error: null } : { q: debounced, options: [], error: result.error })
    })
    return () => {
      cancelled = true
    }
  }, [debounced, open])

  const options = results?.options ?? []
  const error = results?.error ?? null
  const loading = open && results?.q !== debounced

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(
              "h-auto min-h-14 w-full justify-between bg-paper px-3.5 py-2.5 text-left font-normal",
              invalid && "border-regal",
              !value && "text-stone"
            )}
          >
            {value ? (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[0.9375rem] font-semibold text-ink">{value.name}</span>
                <span className="truncate text-caption text-stone">
                  {[value.phone, value.company, value.city].filter(Boolean).join(" · ") || "No contact details yet"}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[0.9375rem]">
                <UserRound aria-hidden="true" className="size-4" /> Search or add a client
              </span>
            )}
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-stone" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-[min(22rem,calc(100vw-2rem))] p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Name, company or phone…" />
            <CommandList>
              {loading && options.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-stone">
                  <Spinner /> Searching…
                </div>
              ) : error ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--st-overdue-fg)]">{error}</p>
              ) : (
                <CommandEmpty>No client matches “{query}”.</CommandEmpty>
              )}
              {options.length > 0 && (
                <CommandGroup heading={query ? "Matching clients" : "Clients"}>
                  {options.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.id}
                      onSelect={() => {
                        onChange(client)
                        setOpen(false)
                      }}
                      className="items-start"
                    >
                      <Check aria-hidden="true" className={cn("mt-0.5 size-4", value?.id === client.id ? "opacity-100" : "opacity-0")} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-semibold text-ink">{client.name}</span>
                        <span className="flex flex-wrap gap-x-3 text-caption text-stone">
                          {client.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone aria-hidden="true" className="size-3" /> {client.phone}
                            </span>
                          )}
                          {(client.company || client.city) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin aria-hidden="true" className="size-3" /> {[client.company, client.city].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    setOpen(false)
                    setCreating(true)
                  }}
                  className="font-semibold text-regal"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {query.trim() ? `Add “${query.trim()}” as a new client` : "Add a new client"}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
            <DialogDescription>Saved straight away and selected for this order.</DialogDescription>
          </DialogHeader>
          <ClientForm
            idPrefix="inline-client"
            defaultValues={{ name: query.trim(), phone: "", alt_phone: "", company: "", address: "", city: "", notes: "" }}
            submitLabel="Add and use client"
            onSubmit={createClientAction}
            onCancel={() => setCreating(false)}
            onSuccess={(client) => {
              setCreating(false)
              setQuery("")
              onChange(client)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
