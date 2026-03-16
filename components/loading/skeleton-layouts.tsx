import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton layout variants for route and in-place loading (Phase 422).
 * Use in loading.tsx and data-loading states to avoid layout shift.
 */

/** Card grid: 3 columns on lg, 2 on sm, 1 on default. Use for dashboard, workspace, marketplace. */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl sm:h-36" />
      ))}
    </div>
  )
}

/** List row: horizontal row with avatar + lines. Use for chat list, workspace list, activity. */
export function SkeletonListRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg p-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
