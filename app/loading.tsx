import { Loader2 } from "lucide-react"

/** Root loading fallback when no route-specific loading is defined */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#e879f9]" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}
