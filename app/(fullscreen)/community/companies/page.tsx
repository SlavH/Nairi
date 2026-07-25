import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Sparkles } from "lucide-react"
import Link from "next/link"

interface CreatorRow {
  id: string
  display_name: string | null
  bio: string | null
  is_verified: boolean
  follower_count: number
  reputation_score: number
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null
}

export default async function CommunityCompaniesPage() {
  const supabase = await createClient()
  const { data: creators } = await supabase
    .from("creator_profiles")
    .select("id, display_name, bio, is_verified, follower_count, reputation_score, profiles(full_name, username, avatar_url)")
    .order("follower_count", { ascending: false })
    .limit(50) as { data: CreatorRow[] | null }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#00c9c8]" />
          Community Companies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizations and creators building on Nairi marketplace.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!creators || creators.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md w-full bg-white/5 backdrop-blur-md border-white/20">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                <Sparkles className="h-7 w-7 text-[#00c9c8] mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No creators yet</h2>
                <p className="text-sm text-muted-foreground">Start selling on the marketplace to appear here.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((creator) => (
              <Link key={creator.id} href={`/marketplace/creator`}>
                <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-white font-bold shrink-0">
                        {(creator.display_name || creator.profiles?.full_name || creator.profiles?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {creator.display_name || creator.profiles?.full_name || creator.profiles?.username || "Creator"}
                          </p>
                          {creator.is_verified && (
                            <Badge className="text-[10px] bg-[#00c9c8]/20 text-[#00c9c8] border-0">✓ Verified</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {creator.follower_count || 0} followers · {creator.reputation_score || 0} reputation
                        </p>
                      </div>
                    </div>
                    {creator.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{creator.bio}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
