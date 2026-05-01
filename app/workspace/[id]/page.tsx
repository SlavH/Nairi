import { createClient } from "@/lib/supabase/server"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Copy, Calendar, Clock, Folder } from "lucide-react"
import { notFound } from "next/navigation"

interface WorkspaceDetailProps {
  params: Promise<{ id: string }>
}

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailProps) {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  const { id } = await params

  let creation: any = null
  try {
    const { data } = await supabase
      .from("creations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    creation = data
  } catch {
    // Table might not exist or creation not found
  }

  if (!creation) {
    // Return a placeholder for demo purposes
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
              <h1 className="font-semibold text-foreground">Creation</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" className="bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Creation #{id}</CardTitle>
                  <CardDescription>This creation will appear here once generated</CardDescription>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No content yet</p>
                <p className="text-sm text-muted-foreground mt-1">Use the workspace to create new content</p>
                <Button asChild className="mt-4 bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                  <Link href="/workspace/create">
                    Create Something
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
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
            <h1 className="font-semibold text-foreground truncate">{creation.title || creation.prompt}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" className="bg-transparent">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">{creation.title || creation.prompt}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(creation.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(creation.created_at).toLocaleTimeString()}
                  </span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">{creation.type || "creation"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">{creation.prompt}</p>
              {creation.content && (
                <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border">
                  <pre className="text-sm whitespace-pre-wrap">{creation.content}</pre>
                </div>
              )}
              {creation.output_url && (
                <div className="mt-6">
                  <a href={creation.output_url} target="_blank" rel="noopener noreferrer" className="text-[#e879f9] hover:underline">
                    View Output <ExternalLink className="h-3 w-3 inline ml-1" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
