"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, ImagePlus, RefreshCw, Trash2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { UploadError, compressPhoto, discardUpload, newPhotoPath, uploadWithProgress } from "@/features/orders/upload"

type ItemPhotoProps = {
  orderId: string
  itemId: string
  itemLabel: string
  path: string | null
  /** Signed URL for a photo that was already saved. */
  savedUrl: string | null
  /** Paths already stored on the saved order — never deleted from here. */
  isSavedPath: (path: string) => boolean
  onChange: (path: string | null) => void
  onBusyChange: (itemId: string, busy: boolean) => void
}

type State =
  | { kind: "idle" }
  | { kind: "compressing" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string; file: File }

export function ItemPhoto({ orderId, itemId, itemLabel, path, savedUrl, isSavedPath, onChange, onBusyChange }: ItemPhotoProps) {
  const [state, setState] = useState<State>({ kind: "idle" })
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const pickerRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => () => void (localPreview && URL.revokeObjectURL(localPreview)), [localPreview])

  const busy = state.kind === "compressing" || state.kind === "uploading"
  useEffect(() => {
    onBusyChange(itemId, busy)
    return () => onBusyChange(itemId, false)
  }, [busy, itemId, onBusyChange])

  async function handleFile(file: File) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      setState({ kind: "compressing" })
      const compressed = await compressPhoto(file)
      setState({ kind: "uploading", progress: 0 })
      const nextPath = newPhotoPath(orderId, itemId)
      await uploadWithProgress(nextPath, compressed, (progress) => setState({ kind: "uploading", progress }), controller.signal)
      if (path && !isSavedPath(path)) void discardUpload(path)
      setLocalPreview(URL.createObjectURL(compressed))
      onChange(nextPath)
      setState({ kind: "idle" })
    } catch (error) {
      if (controller.signal.aborted) return setState({ kind: "idle" })
      setState({ kind: "error", message: error instanceof UploadError ? error.message : "Something went wrong with that photo.", file })
    }
  }

  function remove() {
    if (path && !isSavedPath(path)) void discardUpload(path)
    setLocalPreview(null)
    onChange(null)
  }

  const preview = path ? (localPreview ?? savedUrl) : null
  const inputs = (
    <>
      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) void handleFile(file)
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) void handleFile(file)
        }}
      />
    </>
  )

  if (busy) {
    return (
      <div className="flex min-h-24 flex-col justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-subtle/50 p-4" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Spinner />
          {state.kind === "compressing" ? "Preparing photo…" : `Uploading… ${Math.round(state.progress * 100)}%`}
        </div>
        <Progress value={state.kind === "uploading" ? state.progress * 100 : 5} aria-label={`Photo upload for ${itemLabel}`} />
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => abortRef.current?.abort()}>
          Cancel
        </Button>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-line bg-paper p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-subtle">
          <Image src={preview} alt={`Reference photo for ${itemLabel}`} fill unoptimized sizes="80px" className="object-cover" />
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          {inputs}
          <Button type="button" variant="outline" size="sm" onClick={() => pickerRef.current?.click()}>
            <RefreshCw aria-hidden="true" /> Replace
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-regal hover:text-crimson">
            <Trash2 aria-hidden="true" /> Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {inputs}
      {state.kind === "error" && (
        <p role="alert" className="flex items-start gap-2 text-caption font-semibold text-[var(--st-overdue-fg)]">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => pickerRef.current?.click()}>
          <ImagePlus aria-hidden="true" /> {state.kind === "error" ? "Choose another photo" : "Add photo"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => cameraRef.current?.click()} className="md:hidden">
          <Camera aria-hidden="true" /> Take photo
        </Button>
        {state.kind === "error" && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void handleFile(state.file)}>
            <RefreshCw aria-hidden="true" /> Try again
          </Button>
        )}
      </div>
    </div>
  )
}
