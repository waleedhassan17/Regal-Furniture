import { Lockup, Mark } from "@/components/brand/logo"
import { BRAND_ASSETS } from "@/components/brand/brand-assets"

/**
 * Branded split layout (brand cover, page 1): Bone panel with the lockup and form,
 * Regal Red statement panel on wide screens.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-[25rem] lg:mx-0">
          <Lockup priority className="max-w-[13rem]" />
        </div>
        <main className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-10 lg:mx-0">{children}</main>
        <footer className="mx-auto w-full max-w-[25rem] text-caption text-stone lg:mx-0">
          © Regal Furnitures · Internal use only
        </footer>
      </div>

      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-regal lg:flex lg:flex-col lg:justify-between lg:p-14">
        <p className="eyebrow text-white/85">Factory order portal</p>
        <div className="flex flex-col items-start gap-10">
          {BRAND_ASSETS.markReversed && <Mark tone="light" size={132} />}
          <p className="max-w-md font-display text-[3.25rem] leading-[1.06] font-bold text-white xl:text-display">
            Furniture, faithfully made.
          </p>
        </div>
        <p className="font-display text-[1.25rem] leading-snug text-white/90">
          For the way Pakistan lives, studies and works.
        </p>
      </aside>
    </div>
  )
}
