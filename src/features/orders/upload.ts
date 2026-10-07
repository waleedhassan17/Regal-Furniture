"use client"

import imageCompression from "browser-image-compression"
import { createClient } from "@/lib/supabase/browser"
import { publicEnv } from "@/lib/env"
import { uuidv4 } from "@/lib/uuid"

export const IMAGE_BUCKET = "item-images"
const MAX_EDGE = 1600
const MAX_INPUT_BYTES = 40 * 1024 * 1024

export class UploadError extends Error {}

/** Shrinks a phone photo to ~1600px on the longest edge as JPEG before it leaves the device. */
export async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new UploadError("That file isn't a photo. Choose a JPG or PNG image.")
  if (file.size > MAX_INPUT_BYTES) throw new UploadError("That photo is too large. Choose one under 40 MB.")
  try {
    const out = await imageCompression(file, {
      maxWidthOrHeight: MAX_EDGE,
      maxSizeMB: 0.8,
      initialQuality: 0.82,
      fileType: "image/jpeg",
      // The worker build loads from a CDN; compressing on the main thread keeps everything local.
      useWebWorker: false,
    })
    return new File([out], "photo.jpg", { type: "image/jpeg" })
  } catch {
    throw new UploadError("We couldn't read that photo. Try taking it again or choose another.")
  }
}

/** Uploads to the private bucket with progress (supabase-js has no progress events, so this uses XHR). */
export async function uploadWithProgress(path: string, file: File, onProgress: (fraction: number) => void, signal?: AbortSignal) {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new UploadError("Your session has ended. Sign in again to upload photos.")

  const url = `${publicEnv.supabaseUrl}/storage/v1/object/${IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("apikey", publicEnv.supabaseAnonKey)
    xhr.setRequestHeader("x-upsert", "false")
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.setRequestHeader("cache-control", "max-age=3600")
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else if (xhr.status === 403 || xhr.status === 401) reject(new UploadError("You don't have permission to upload photos."))
      else if (xhr.status === 413) reject(new UploadError("That photo is too large to upload."))
      else reject(new UploadError("The upload didn't finish. Check your connection and try again."))
    }
    xhr.onerror = () => reject(new UploadError("The upload failed. Check your connection and try again."))
    xhr.onabort = () => reject(new UploadError("Upload cancelled."))
    signal?.addEventListener("abort", () => xhr.abort())
    xhr.send(file)
  })
}

/** Best-effort removal of a photo uploaded in this session but never saved. */
export async function discardUpload(path: string) {
  try {
    await createClient().storage.from(IMAGE_BUCKET).remove([path])
  } catch {
    // Ignore: an orphaned photo is harmless and costs only storage.
  }
}

export function newPhotoPath(orderId: string, itemId: string) {
  return `orders/${orderId}/${itemId}/${uuidv4()}.jpg`
}
