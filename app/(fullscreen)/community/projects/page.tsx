import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderGit2, Sparkles } from "lucide-react"
import Link from "next/link"

interface ProjectRow {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  user_id: string
  profiles: { full_name: string | null; username: string | null } | null
}

export default async function CommunityProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("builder_projects")
    .select("id, name, description, created_at, updated_at, user_id, profiles(full_name, username)")
    .order("updated_at", { ascending: false })
    .limit(50) as { data: ProjectRow[] | null }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FolderGit2 className="h-6 w-6 text-[#00c9c8]" />
          Community Projects
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and collaborate on community-built projects.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!projects || projects.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md w-full bg-white/5 backdrop-blur-md border-white/20">
              <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                <Sparkles className="h-7 w-7 text-[#00c9c8] mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No projects yet</h2>
                <p className="text-sm text-muted-foreground">Build something amazing with the AI Builder!</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/builder`}>
                <Card className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(project.profiles?.full_name || project.profiles?.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{project.name}</p>
                        {project.profiles && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {project.profiles.full_name || project.profiles.username || "Anonymous"}
                          </p>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                        builder
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
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
