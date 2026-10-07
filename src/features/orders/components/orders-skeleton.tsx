import { Skeleton } from "@/components/ui/skeleton"

export function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading orders">
      <Skeleton className="h-11" />
      <Skeleton className="hidden h-[9.5rem] lg:block" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 lg:h-[4.5rem]" />
        ))}
      </div>
    </div>
  )
}
