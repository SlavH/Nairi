import { createClient } from "@/lib/supabase/server"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Plus, 
  Presentation, 
  Globe, 
  FileText, 
  Palette, 
  Code, 
  BarChart3,
  Clock,
  Folder,
  Star,
  MoreHorizontal,
  Image,
  Video,
  Mic
} from "lucide-react"

const typeIcons: Record<string, typeof Presentation> = {
  presentation: Presentation,
  website: Globe,
  document: FileText,
  visual: Palette,
  code: Code,
  analysis: BarChart3,
  image: Image,
  video: Video,
  audio: Mic,
  // Builder-generated types (with "generated-" prefix)
  "generated-landing-page": Globe,
  "generated-website": Globe,
  "generated-portfolio": Globe,
  "generated-dashboard": BarChart3,
  "generated-mobile-app": Globe,
  "generated-presentation": Presentation,
  "generated-document": FileText,
  "generated-code": Code,
  "generated-analysis": BarChart3,
  "generated-visual": Palette,
  "generated-ecommerce": Globe,
  "generated-blog": FileText,
  "generated-saas": Globe,
  "generated-admin-panel": BarChart3,
  "generated-social-app": Globe,
}

const typeColors: Record<string, string> = {
  presentation: "from-orange-500 to-red-500",
  website: "from-blue-500 to-cyan-500",
  document: "from-green-500 to-emerald-500",
  visual: "from-pink-500 to-rose-500",
  code: "from-slate-500 to-zinc-600",
  analysis: "from-indigo-500 to-violet-500",
  image: "from-purple-500 to-fuchsia-500",
  video: "from-red-500 to-pink-500",
  audio: "from-cyan-500 to-blue-500",
  // Builder-generated types (with "generated-" prefix)
  "generated-landing-page": "from-blue-500 to-cyan-500",
  "generated-website": "from-blue-500 to-cyan-500",
  "generated-portfolio": "from-purple-500 to-pink-500",
  "generated-dashboard": "from-indigo-500 to-violet-500",
  "generated-mobile-app": "from-green-500 to-emerald-500",
  "generated-presentation": "from-orange-500 to-red-500",
  "generated-document": "from-green-500 to-emerald-500",
  "generated-code": "from-slate-500 to-zinc-600",
  "generated-analysis": "from-indigo-500 to-violet-500",
  "generated-visual": "from-pink-500 to-rose-500",
  "generated-ecommerce": "from-yellow-500 to-orange-500",
  "generated-blog": "from-teal-500 to-cyan-500",
  "generated-saas": "from-blue-600 to-indigo-600",
  "generated-admin-panel": "from-gray-500 to-slate-600",
  "generated-social-app": "from-pink-500 to-red-500",
}

// Helper to get display name for type (removes "generated-" prefix)
function getTypeDisplayName(type: string): string {
  return type.replace(/^generated-/, '').replace(/-/g, ' ')
}

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  // Try to fetch creations, handle gracefully if table doesn't exist
  let creations: any[] = []
  try {
    const { data } = await supabase
      .from("creations")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20)
    
    creations = data || []
  } catch {
    // Table might not exist yet
    creations = []
  }

  const recentCreations = creations.slice(0, 6)
  const stats = {
    total: creations.length,
    thisWeek: creations.filter(c => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(c.created_at) > weekAgo
    }).length,
    byType: creations.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-foreground">Workspace</h1>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
            <Link href="/workspace/create">
              <Plus className="h-4 w-4 mr-2" />
              New Creation
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Creations</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.thisWeek}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Created</p>
                  <p className="text-xl font-bold text-foreground mt-1 capitalize">
                    {(Object.entries(stats.byType) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Creation Types</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{Object.keys(stats.byType).length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Create */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Create</CardTitle>
            <CardDescription>Choose a type to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(typeIcons).filter(([type]) => !type.startsWith('generated-')).map(([type, Icon]) => (
                <Link
                  key={type}
                  href={`/workspace/create?type=${type}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-[#e879f9]/50 bg-background/50 hover:bg-background transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${typeColors[type]} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-foreground capitalize">{type}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Creations */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Creations</CardTitle>
                <CardDescription>Your latest projects</CardDescription>
              </div>
              {creations.length > 6 && (
                <Button asChild variant="outline" size="sm" className="bg-transparent">
                  <Link href="/workspace/all">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentCreations.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentCreations.map((creation) => {
                  const Icon = typeIcons[creation.type] || FileText
                  return (
                    <Link
                      key={creation.id}
                      href={`/workspace/${creation.id}`}
                      className="p-4 rounded-xl border border-border bg-background/50 hover:border-[#22d3ee]/50 transition-all group block"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${typeColors[creation.type] || "from-gray-500 to-gray-600"} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-medium text-foreground line-clamp-1">{creation.prompt}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {getTypeDisplayName(creation.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(creation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-4">No creations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start by creating your first project
                </p>
                <Button asChild className="mt-4 bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                  <Link href="/workspace/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Something
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
