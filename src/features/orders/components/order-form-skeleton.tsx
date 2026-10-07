import { Skeleton } from "@/components/ui/skeleton"

export function OrderFormSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]" aria-busy="true" aria-label="Loading form">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="hidden h-80 lg:block" />
    </div>
  )
}
