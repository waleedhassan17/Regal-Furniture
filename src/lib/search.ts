/**
 * Makes user search text safe to embed in a PostgREST `or=(...)` filter: strips the
 * characters that have meaning there (, . ( ) " * % \ :) and caps the length.
 */
export function sanitizeSearch(raw: string | null | undefined): string {
  if (!raw) return ""
  return raw
    .replace(/[,.()"*%\\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
}

/** Digits only, for matching phone numbers typed with or without dashes. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

export const PAGE_SIZE = 20

export function pageRange(page: number, size = PAGE_SIZE): [number, number] {
  const p = Math.max(1, Math.floor(page) || 1)
  return [(p - 1) * size, p * size - 1]
}
