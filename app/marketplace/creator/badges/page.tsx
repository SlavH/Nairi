import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Award } from "lucide-react"
import { getSessionOrBypass } from "@/lib/auth"
import { getCreatorBadges, listExpertBadges } from "@/lib/features/badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function CreatorBadgesPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const [earned, catalog] = await Promise.all([
    getCreatorBadges(user.id),
    listExpertBadges(),
  ])
  const earnedBadgeIds = new Set(earned.map((b) => b.badge_id))

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
          <Link href="/marketplace/creator" aria-label="Back to creator">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Link href="/marketplace" className="flex items-center gap-2 min-w-0">
          <Image
            src="/images/nairi-logo-header.jpg"
            alt="Nairi"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg border border-white/20 shrink-0"
          />
          <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent truncate">
            Expert badges
          </span>
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your badges
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Verification badges you’ve earned. They appear on your creator profile.
            </p>
          </CardHeader>
          <CardContent>
            {earned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven’t earned any badges yet. Complete exams or verification to earn them.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {earned.map((ub) => (
                  <div
                    key={ub.id}
                    className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 flex items-center gap-3"
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: (ub.expert_badges as { color?: string } | null)?.color
                          ? `${(ub.expert_badges as { color: string }).color}20`
                          : "rgba(255,255,255,0.1)",
                        color: (ub.expert_badges as { color?: string } | null)?.color ?? "inherit",
                      }}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {(ub.expert_badges as { name?: string } | null)?.name ?? "Badge"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(ub.expert_badges as { domain?: string } | null)?.domain ?? ""} · earned{" "}
                        {new Date(ub.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/20">
          <CardHeader>
            <CardTitle>Badge catalog</CardTitle>
            <p className="text-sm text-muted-foreground">
              Available expert badges. Earn them via exams, contributions, or verification.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.map((b) => {
                const has = earnedBadgeIds.has(b.id)
                return (
                  <div
                    key={b.id}
                    className={`rounded-lg border px-4 py-3 ${
                      has ? "border-green-500/30 bg-green-500/5" : "border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: b.color ? `${b.color}20` : "rgba(255,255,255,0.1)",
                            color: b.color ?? "inherit",
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <Badge variant="secondary" className="text-xs mt-0.5">
                            {b.domain}
                          </Badge>
                        </div>
                      </div>
                      {has && (
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 shrink-0">
                          Earned
                        </Badge>
                      )}
                    </div>
                    {b.description && (
                      <p className="text-xs text-muted-foreground mt-2">{b.description}</p>
                    )}
                    {b.requirements && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Requirements: {b.requirements}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
