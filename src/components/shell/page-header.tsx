import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: React.ReactNode
  eyebrow?: string
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: React.ReactNode
  className?: string
}

/** Page title block: red eyebrow label (as in the brand book), Playfair title, optional actions. */
export function PageHeader({ title, eyebrow, description, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {back && <div className="mb-3">{back}</div>}
        {eyebrow && <p className="eyebrow mb-2 text-regal">{eyebrow}</p>}
        <h1 className="font-heading text-[1.875rem] leading-[1.12] font-bold tracking-[-0.01em] text-ink sm:text-h1">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-sm leading-relaxed text-stone">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
    </header>
  )
}
