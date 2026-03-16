import { Card, CardContent } from "@/components/ui/card"
import { Building2, Sparkles } from "lucide-react"

export default function CommunityCompaniesPage() {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#00c9c8]" />
          Community Companies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizations and teams using Nairi.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white/5 backdrop-blur-md border-white/20 border-[#00c9c8]/20">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full bg-[#00c9c8]/10 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-[#00c9c8]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Coming soon</h2>
            <p className="text-sm text-muted-foreground">
              Community companies will showcase teams and organizations. We’re building this next.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
