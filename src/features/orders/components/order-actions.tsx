"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Archive, ArchiveRestore, EllipsisVertical, Pencil, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { setArchivedAction } from "@/features/orders/actions"

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  )
}

type OrderActionsProps = {
  orderId: string
  orderNumber: string
  isAdmin: boolean
  isArchived: boolean
  whatsAppUrl: string
}

export function OrderActions({ orderId, orderNumber, isAdmin, isArchived, whatsAppUrl }: OrderActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggleArchive() {
    startTransition(async () => {
      const result = await setArchivedAction({ orderId, archived: !isArchived })
      if (!result.ok) toast.error(result.error)
      else toast.success(result.message ?? "Done")
      setConfirming(false)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline">
        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="size-4 text-[#1f7a4c]" /> Share
        </a>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/orders/${orderId}/print`} prefetch={false}>
          <Printer aria-hidden="true" /> Job sheet
        </Link>
      </Button>
      {isAdmin && (
        <>
          <Button asChild variant="ink">
            <Link href={`/orders/${orderId}/edit`}>
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More order actions">
                <EllipsisVertical aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${orderId}/print`} prefetch={false}>
                  <Printer aria-hidden="true" /> Print job sheet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant={isArchived ? "default" : "destructive"} onSelect={() => setConfirming(true)}>
                {isArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
                {isArchived ? "Restore order" : "Archive order"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArchived ? `Restore ${orderNumber}?` : `Archive ${orderNumber}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived
                ? "The order returns to the lists and the dashboard, and staff can update it again."
                : "Archived orders are hidden from lists, the dashboard and reminders. Nothing is deleted — you can restore it at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={isArchived ? "default" : "destructive"}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                toggleArchive()
              }}
            >
              {pending && <Spinner />}
              {isArchived ? "Restore order" : "Archive order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
