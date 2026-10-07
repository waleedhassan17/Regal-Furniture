/**
 * Logo files supplied by Regal (copied from brand/ into public/brand/).
 * Set a path to null when the file is not available; components then fall back to a
 * plain text wordmark. Never redraw, recolour or stretch the supplied artwork.
 */
export const BRAND_ASSETS: {
  lockup: { src: string; width: number; height: number } | null
  lockupReversed: { src: string; width: number; height: number } | null
  mark: { src: string; width: number; height: number } | null
  markReversed: { src: string; width: number; height: number } | null
} = {
  lockup: null,
  lockupReversed: null,
  mark: null,
  markReversed: null,
}
