"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MessageSquareText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format/date"
import { addNoteAction, deleteNoteAction } from "@/features/orders/actions"

type Note = { id: string; body: string; created_at: string; author_name: string }

/** Append-only notes: anyone can add; each shows who wrote it and when. */
export function OrderNotes({ orderId, notes, canDelete }: { orderId: string; notes: Note[]; canDelete: boolean }) {
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return setError("Write a note first.")
    setError(null)
    startTransition(async () => {
      const result = await addNoteAction({ orderId, body: text })
      if (!result.ok) return setError(result.error)
      setBody("")
      toast.success("Note added")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText aria-hidden="true" className="size-[18px] text-stone" /> Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor="new-note" className="sr-only">
            Add a note
          </label>
          <Textarea
            id="new-note"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="min-h-20"
            placeholder="e.g. Polish starts Monday; client called about colour"
            aria-invalid={!!error}
            aria-describedby={error ? "new-note-error" : undefined}
            maxLength={2000}
          />
          {error && (
            <p id="new-note-error" role="alert" className="text-caption font-semibold text-[var(--st-overdue-fg)]">
              {error}
            </p>
          )}
          <Button type="submit" variant="ink" size="sm" className="self-end" disabled={pending || !body.trim()}>
            {pending && <Spinner />} Add note
          </Button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-stone">No notes yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {notes.map((note) => (
              <li key={note.id} className="group py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-caption text-stone">
                    <span className="font-bold text-ink">{note.author_name}</span> · {formatDateTime(note.created_at)}
                  </p>
                  {canDelete && <DeleteNote orderId={orderId} noteId={note.id} />}
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">{note.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function DeleteNote({ orderId, noteId }: { orderId: string; noteId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Remove note"
      disabled={pending}
      className="-mt-1 text-stone opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
      onClick={() =>
        startTransition(async () => {
          const result = await deleteNoteAction({ orderId, noteId })
          if (!result.ok) toast.error(result.error)
          else toast.success("Note removed")
        })
      }
    >
      {pending ? <Spinner /> : <Trash2 aria-hidden="true" />}
    </Button>
  )
}
