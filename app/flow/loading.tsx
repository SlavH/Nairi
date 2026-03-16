import { Skeleton } from "@/components/ui/skeleton"

export default function FlowLoading() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  )
}
