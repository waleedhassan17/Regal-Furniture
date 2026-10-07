import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: React.ReactNode
  className?: string
}

/** Page title block: title, optional description and actions. */
export function PageHeader({ title, description, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {back && <div className="mb-3">{back}</div>}
        <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-ink sm:text-h1">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-stone">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
    </header>
  )
}
