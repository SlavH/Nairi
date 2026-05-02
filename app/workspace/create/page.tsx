import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
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
  Image,
  Video,
  Mic,
  Music,
  Sparkles,
  Zap,
  BookOpen,
  MessageSquare,
  Search,
  Share2,
  Workflow,
  PenTool,
  Headphones,
  DollarSign,
  Layers,
  Box,
  Film,
  Megaphone,
} from "lucide-react"

const creationTypes = [
  { id: "presentation", label: "Presentation", icon: Presentation, color: "from-orange-500 to-red-500", description: "Create professional presentations with AI" },
  { id: "website", label: "Website", icon: Globe, color: "from-blue-500 to-cyan-500", description: "Build responsive websites from descriptions" },
  { id: "document", label: "Document", icon: FileText, color: "from-green-500 to-emerald-500", description: "Generate documents, reports, and proposals" },
  { id: "visual", label: "Visual Design", icon: Palette, color: "from-pink-500 to-rose-500", description: "Create diagrams, posters, and graphics" },
  { id: "code", label: "Code", icon: Code, color: "from-slate-500 to-zinc-600", description: "Write and debug code in any language" },
  { id: "analysis", label: "Analysis", icon: BarChart3, color: "from-indigo-500 to-violet-500", description: "Data analysis and visualization" },
  { id: "image", label: "Image", icon: Image, color: "from-purple-500 to-fuchsia-500", description: "Generate images from text prompts" },
  { id: "video", label: "Video", icon: Video, color: "from-red-500 to-pink-500", description: "Create videos with AI" },
  { id: "audio", label: "Audio", icon: Mic, color: "from-cyan-500 to-blue-500", description: "Text-to-speech and audio generation" },
  { id: "song", label: "Song", icon: Music, color: "from-amber-500 to-orange-500", description: "Generate music and songs" },
  { id: "simulation", label: "Simulation", icon: Zap, color: "from-yellow-500 to-lime-500", description: "Create interactive simulations" },
  { id: "course", label: "Course", icon: BookOpen, color: "from-teal-500 to-cyan-500", description: "Build educational courses" },
  { id: "chat", label: "Chat Agent", icon: MessageSquare, color: "from-blue-500 to-indigo-500", description: "Create AI chat agents" },
  { id: "search", label: "Search Agent", icon: Search, color: "from-emerald-500 to-green-500", description: "Build search and research agents" },
  { id: "tool", label: "Tool", icon: Share2, color: "from-violet-500 to-purple-500", description: "Create specialized AI tools" },
  { id: "workflow", label: "Workflow", icon: Workflow, color: "from-sky-500 to-blue-500", description: "Build multi-step AI workflows" },
  { id: "template", label: "Template", icon: PenTool, color: "from-rose-500 to-pink-500", description: "Design reusable templates" },
  { id: "prompt", label: "Prompt", icon: Sparkles, color: "from-fuchsia-500 to-pink-500", description: "Craft optimized prompts" },
  { id: "voice", label: "Voice Clone", icon: Headphones, color: "from-orange-500 to-red-500", description: "Clone and generate voices" },
  { id: "product", label: "Product", icon: DollarSign, color: "from-green-500 to-teal-500", description: "Create product descriptions" },
  { id: "3d", label: "3D Model", icon: Box, color: "from-gray-500 to-slate-600", description: "Generate 3D models from text" },
  { id: "layer", label: "Multi-Layer", icon: Layers, color: "from-indigo-500 to-purple-500", description: "Complex multi-layered projects" },
  { id: "short-video", label: "Short Video", icon: Film, color: "from-pink-500 to-red-500", description: "Short-form video content" },
  { id: "ad-copy", label: "Ad Copy", icon: Megaphone, color: "from-yellow-500 to-orange-500", description: "Generate advertising copy" },
]

interface CreatePageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const supabase = await createClient()
  const user = await getSession(() => supabase.auth.getUser())

  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  const { type } = await searchParams
  const selectedType = type ? creationTypes.find((t) => t.id === type) : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-muted-foreground hover:text-foreground transition-colors">
              Workspace
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-foreground">Create</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {selectedType ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${selectedType.color} flex items-center justify-center`}>
                    <selectedType.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground capitalize">{selectedType.label}</CardTitle>
                    <CardDescription>{selectedType.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">Describe what you want to create and Nairi will generate it for you.</p>
                <form action="/api/create" method="POST">
                  <input type="hidden" name="type" value={selectedType.id} />
                  <textarea
                    name="prompt"
                    placeholder="Describe your project in detail..."
                    className="w-full h-32 p-4 rounded-lg border border-border bg-background/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#e879f9]/50"
                    required
                  />
                  <div className="flex justify-end mt-4">
                    <Button type="submit" className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </form>
                <Link href="/workspace/create">
                  <Button variant="outline" className="w-full bg-transparent">
                    Choose Different Type
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">What would you like to create?</h2>
              <p className="text-muted-foreground">Choose a creation type to get started</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {creationTypes.map(({ id, label, icon: Icon, color, description }) => (
                <Link
                  key={id}
                  href={`/workspace/create?type=${id}`}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border border-border hover:border-[#e879f9]/50 bg-background/50 hover:bg-background transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
