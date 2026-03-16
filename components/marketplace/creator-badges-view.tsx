"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, CheckCircle2 } from "lucide-react"

type ExpertBadge = {
  id: string
  name: string
  domain: string
  description: string | null
  requirements: string | null
  icon: string | null
  color: string | null
}

type UserBadgeWithExpert = {
  id: string
  earned_at: string
  earned_via: string | null
  expert_badges: ExpertBadge | null
}

interface CreatorBadgesViewProps {
  earnedBadges: UserBadgeWithExpert[]
  catalog: ExpertBadge[]
  userId: string
}

export function CreatorBadgesView({ earnedBadges, catalog, userId }: CreatorBadgesViewProps) {
  const [awarding, setAwarding] = useState<string | null>(null)

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.expert_badges?.id).filter(Boolean))

  const handleAward = async (badgeId: string) => {
    setAwarding(badgeId)
    try {
      const res = await fetch(`/api/users/${userId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: badgeId, earned_via: "verification" }),
      })
      if (res.ok) window.location.reload()
    } finally {
      setAwarding(null)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Your badges ({earnedBadges.length})
        </h2>
        {earnedBadges.length === 0 ? (
          <p className="text-muted-foreground text-sm">You haven’t earned any badges yet. Browse the catalog below.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earnedBadges.map((ub) => (
              <Card key={ub.id} className="bg-white/5 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: ub.expert_badges?.color ? `${ub.expert_badges.color}20` : undefined }}
                    >
                      <Award className="h-5 w-5" style={{ color: ub.expert_badges?.color ?? undefined }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{ub.expert_badges?.name ?? "Badge"}</p>
                      <p className="text-xs text-muted-foreground">
                        {ub.expert_badges?.domain?.replace(/_/g, " ")} · {ub.earned_via ?? "earned"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ub.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Badge catalog</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Expert badges are awarded after verification (exam, contribution, or admin). Request or complete requirements to earn.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((b) => {
            const earned = earnedBadgeIds.has(b.id)
            return (
              <Card key={b.id} className="bg-white/5 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: b.color ? `${b.color}20` : undefined }}
                    >
                      <Award className="h-4 w-4" style={{ color: b.color ?? undefined }} />
                    </span>
                    {b.name}
                  </CardTitle>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {b.domain.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                  {b.requirements && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Requirements:</strong> {b.requirements}
                    </p>
                  )}
                  {earned ? (
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Earned</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!awarding}
                      onClick={() => handleAward(b.id)}
                    >
                      {awarding === b.id ? "Requesting…" : "Request / Self-award"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
