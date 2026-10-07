import Link from "next/link"
import { Lockup, Mark } from "@/components/brand/logo"
import { BRAND_ASSETS } from "@/components/brand/brand-assets"

/**
 * Branded split layout (brand cover, page 1): Bone panel with the lockup and form,
 * Regal Red statement panel on wide screens.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-[25rem] lg:mx-0">
          <Link href="/" aria-label="Regal Furnitures — home" className="inline-block rounded-md">
            <Lockup priority className="max-w-[13rem]" />
          </Link>
        </div>
        <main className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10 lg:mx-0">{children}</main>
        <footer className="mx-auto w-full max-w-[25rem] text-caption text-stone lg:mx-0">
          © Regal Furnitures · Internal use only
        </footer>
      </div>

      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-regal lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Hexagon frames — the brand's motif — as quiet texture. */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-28 -bottom-32 size-[34rem] text-white/[0.09]" fill="none">
          <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
        </svg>
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute top-16 -right-10 size-48 text-white/[0.07]" fill="none">
          <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        </svg>
        <p className="eyebrow relative text-white/85">Factory order portal</p>
        <div className="relative flex flex-col items-start gap-10">
          {BRAND_ASSETS.markReversed && <Mark tone="light" size={132} />}
          <p className="max-w-md font-display text-[3rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white xl:text-display">
            Furniture, faithfully made.
          </p>
        </div>
        <p className="relative text-[1.125rem] leading-snug font-medium text-white/90">
          For the way Pakistan lives, studies and works.
        </p>
      </aside>
    </div>
  )
}
