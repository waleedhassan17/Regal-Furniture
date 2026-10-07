import Image from "next/image"
import { cn } from "@/lib/utils"
import { BRAND_ASSETS } from "@/components/brand/brand-assets"

type Tone = "dark" | "light"

/**
 * Full lockup (mark + wordmark). Uses the supplied artwork from public/brand when present,
 * otherwise a plain text wordmark set in the brand typefaces.
 */
export function Lockup({ tone = "dark", className, priority }: { tone?: Tone; className?: string; priority?: boolean }) {
  const asset = tone === "light" ? (BRAND_ASSETS.lockupReversed ?? BRAND_ASSETS.lockup) : BRAND_ASSETS.lockup
  if (asset) {
    return (
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt="Regal Furnitures"
        priority={priority}
        className={cn("h-auto w-full max-w-[16rem]", className)}
      />
    )
  }
  return <Wordmark tone={tone} className={className} />
}

/** Text wordmark used when logo files are not supplied. */
export function Wordmark({ tone = "dark", className }: { tone?: Tone; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Regal Furnitures"
      className={cn("inline-flex flex-col leading-none select-none", tone === "light" ? "text-bone" : "text-ink", className)}
    >
      <span className="font-sans text-[1.625rem] font-extrabold tracking-[0.14em]">REGAL</span>
      <span className="mt-1.5 font-sans text-[0.5625rem] font-semibold tracking-[0.62em] opacity-80">FURNITURES</span>
    </span>
  )
}

/** The hexagonal R mark when supplied; otherwise a typographic monogram (never a redrawn mark). */
export function Mark({ tone = "dark", size = 40, className }: { tone?: Tone; size?: number; className?: string }) {
  const asset = tone === "light" ? (BRAND_ASSETS.markReversed ?? BRAND_ASSETS.mark) : BRAND_ASSETS.mark
  if (asset) {
    return (
      <Image
        src={asset.src}
        width={size}
        height={Math.round((size * asset.height) / asset.width)}
        alt="Regal Furnitures"
        className={className}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label="Regal Furnitures"
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-heading text-[1.375rem] leading-none font-bold select-none",
        tone === "light" ? "bg-bone/10 text-bone" : "bg-ink text-bone",
        className
      )}
    >
      R
    </span>
  )
}
