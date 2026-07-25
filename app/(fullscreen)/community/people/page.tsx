import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function CommunityPeoplePage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at, tokens_balance, subscription_tier")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-[#00c9c8]" />
          Community People
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Creators, builders, and collaborators using Nairi.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!profiles || profiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md w-full bg-white/5 backdrop-blur-md border-white/20">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                <Sparkles className="h-7 w-7 text-[#00c9c8] mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No people yet</h2>
                <p className="text-sm text-muted-foreground">Be the first to join the community!</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <Link key={profile.id} href={`/profile`}>
                <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-white font-bold shrink-0">
                      {(profile.full_name || profile.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {profile.full_name || profile.username || "Anonymous"}
                      </p>
                      {profile.bio && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{profile.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {profile.subscription_tier && profile.subscription_tier !== "free" && (
                          <Badge variant="outline" className="text-[10px] border-[#00c9c8]/30 text-[#00c9c8]">
                            {profile.subscription_tier}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
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
