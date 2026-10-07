import Link from "next/link"
import { Lockup, Mark } from "@/components/brand/logo"
import { HexOutline } from "@/components/brand/hexagon"
import { BRAND_ASSETS } from "@/components/brand/brand-assets"

/**
 * Sign-in screens: white panel with the lockup and form; Regal Red brand panel on wide screens
 * (brand book cover, page 1).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-[30rem] lg:mx-0">
          <Link href="/" aria-label="Regal Furnitures — home" className="inline-block rounded-md">
            <Lockup priority className="max-w-[11rem]" />
          </Link>
        </div>
        <main className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col justify-center py-10 lg:mx-0">{children}</main>
        <footer className="mx-auto w-full max-w-[30rem] text-caption text-stone lg:mx-0">© Regal Furnitures · Internal use only</footer>
      </div>

      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-regal lg:flex lg:flex-col lg:justify-between lg:p-14">
        <HexOutline className="pointer-events-none absolute -right-64 -bottom-40 size-[34rem] text-white/[0.08]" />
        <div className="relative">
          {BRAND_ASSETS.markReversed ? <Mark tone="light" size={96} /> : <Lockup tone="light" size="lg" />}
        </div>
        <div className="relative">
          <p className="max-w-md text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.03em] text-white xl:text-[3rem]">
            Furniture for the way Pakistan lives, studies and works.
          </p>
          <p className="mt-5 text-sm font-medium text-white/85">Homes · Schools · Offices</p>
        </div>
      </aside>
    </div>
  )
}
