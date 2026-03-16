import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Share2, 
  Presentation, 
  Globe, 
  FileText, 
  Palette, 
  Code, 
  BarChart3,
  Clock,
  Sparkles
} from "lucide-react"
import { CreationActions } from "@/components/workspace/creation-actions"

const typeIcons: Record<string, typeof Presentation> = {
  presentation: Presentation,
  website: Globe,
  document: FileText,
  visual: Palette,
  code: Code,
  analysis: BarChart3,
  simulation: BarChart3,
}

const typeColors: Record<string, string> = {
  presentation: "from-orange-500 to-red-500",
  website: "from-blue-500 to-cyan-500",
  document: "from-green-500 to-emerald-500",
  visual: "from-pink-500 to-rose-500",
  code: "from-slate-500 to-zinc-600",
  analysis: "from-indigo-500 to-violet-500",
  simulation: "from-amber-500 to-orange-500",
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function CreationViewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Handle static routes that shouldn't reach this dynamic route
  if (id === "create") {
    redirect("/workspace/create")
  }
  
  // Check if id is a valid UUID before querying
  if (!isValidUUID(id)) {
    redirect("/workspace")
  }

  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: creation, error } = await supabase
    .from("creations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !creation) {
    notFound()
  }

  const Icon = typeIcons[creation.type] || FileText
  const colorClass = typeColors[creation.type] || "from-gray-500 to-gray-600"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="bg-transparent">
              <Link href="/workspace">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground line-clamp-1 max-w-md">{creation.prompt}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs capitalize">{creation.type}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(creation.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <CreationActions creation={creation} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#e879f9]" />
                  Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-foreground bg-background rounded-lg p-4 overflow-auto max-h-[600px]">
                    {creation.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Original Prompt</p>
                  <p className="text-sm text-foreground mt-1">{creation.prompt}</p>
                </div>
                
                {creation.options && (
                  <>
                    {creation.options.style && (
                      <div>
                        <p className="text-xs text-muted-foreground">Style</p>
                        <p className="text-sm text-foreground mt-1 capitalize">{creation.options.style}</p>
                      </div>
                    )}
                    {creation.options.length && (
                      <div>
                        <p className="text-xs text-muted-foreground">Length</p>
                        <p className="text-sm text-foreground mt-1 capitalize">{creation.options.length}</p>
                      </div>
                    )}
                  </>
                )}

                {creation.metadata && (
                  <div>
                    <p className="text-xs text-muted-foreground">Generated By</p>
                    <p className="text-sm text-foreground mt-1">{creation.metadata.provider || "Nairi AI"}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(creation.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                  <Link href={`/workspace/create?type=${creation.type}`}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Similar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/workspace">
                    View All Creations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
