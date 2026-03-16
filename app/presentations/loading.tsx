import { Skeleton } from "@/components/ui/skeleton"

export default function PresentationsLoading() {
  return (
    <div className="page-container py-10 space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
      </div>
    </div>
  )
}
