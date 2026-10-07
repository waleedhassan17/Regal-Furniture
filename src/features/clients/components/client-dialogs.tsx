"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClientForm } from "@/features/clients/components/client-form"
import { createClientAction, updateClientAction } from "@/features/clients/actions"
import type { ClientFormValues } from "@/features/clients/schema"

export function NewClientDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" /> New client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>Only the name is required. You can add details later.</DialogDescription>
        </DialogHeader>
        <ClientForm
          idPrefix="new-client"
          submitLabel="Add client"
          onSubmit={createClientAction}
          onCancel={() => setOpen(false)}
          onSuccess={(client, message) => {
            setOpen(false)
            toast.success(message ?? "Client added")
            router.push(`/clients/${client.id}`)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export function EditClientDialog({ client }: { client: ClientFormValues & { id: string } }) {
  const [open, setOpen] = useState(false)
  const { id, ...values } = client
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil aria-hidden="true" /> Edit details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Changes apply to future orders. Existing orders keep their delivery address.</DialogDescription>
        </DialogHeader>
        <ClientForm
          idPrefix="edit-client"
          defaultValues={values}
          submitLabel="Save changes"
          onSubmit={(v) => updateClientAction({ id, ...v })}
          onCancel={() => setOpen(false)}
          onSuccess={(_, message) => {
            setOpen(false)
            toast.success(message ?? "Saved")
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
