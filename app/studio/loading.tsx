import { Skeleton } from "@/components/ui/skeleton"

export default function StudioLoading() {
  return (
    <div className="page-container py-12 space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-lg" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}
