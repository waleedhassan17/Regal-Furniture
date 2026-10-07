import "server-only"
import { headers } from "next/headers"

/**
 * Public base URL for links that leave the app (WhatsApp shares). Uses NEXT_PUBLIC_SITE_URL
 * when set; otherwise the address the request came in on, so links are right on Vercel even
 * if the variable was forgotten.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configured) return configured
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return "http://localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")
  return `${proto}://${host}`
}
