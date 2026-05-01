import { createClient } from "@/lib/supabase/server"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Plus, Folder, MoreHorizontal, Clock } from "lucide-react"

const typeIcons: Record<string, string> = {
  presentation: "📊",
  website: "🌐",
  document: "📄",
  visual: "🎨",
  code: "💻",
  analysis: "📈",
  image: "🖼️",
  video: "🎬",
  audio: "🎙️",
  song: "🎵",
  simulation: "⚡",
  course: "📚",
  chat: "💬",
  search: "🔍",
  tool: "🔧",
  workflow: "🔄",
  template: "📋",
  prompt: "✨",
  voice: "🎧",
  product: "🛍️",
  "3d": "📦",
  layer: "📑",
  "short-video": "🎞️",
  "ad-copy": "📢",
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
}

export default async function AllCreationsPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  let creations: any[] = []
  try {
    const { data } = await supabase
      .from("creations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    creations = data || []
  } catch {
    creations = []
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 min-h-[44px]">
              <ArrowLeft className="h-4 w-4" />
              Workspace
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-foreground">All Creations</h1>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
            <Link href="/workspace/create">
              <Plus className="h-4 w-4 mr-2" />
              New Creation
            </Link>
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {creations.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">{creations.length} creation{creations.length !== 1 ? "s" : ""} total</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creations.map((creation) => (
                <Link
                  key={creation.id}
                  href={`/workspace/${creation.id}`}
                  className="p-4 rounded-xl border border-border bg-background/50 hover:border-[#22d3ee]/50 transition-all group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{typeIcons[creation.type] || "📁"}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-1">{creation.title || creation.prompt || "Untitled"}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {creation.type?.replace(/^generated-/, "").replace(/-/g, " ") || "creation"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(creation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Card className="bg-card/50 border-border">
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
