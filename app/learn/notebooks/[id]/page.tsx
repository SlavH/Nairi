import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSessionOrBypass } from "@/lib/auth"
import { NotebookView } from "@/components/learn/notebook-view"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function NotebookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const { data: notebook } = await supabase
    .from("learn_notebooks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!notebook) notFound()

  const { data: sources } = await supabase
    .from("learn_notebook_sources")
    .select("id, title, content, source_type, url, created_at")
    .eq("notebook_id", id)
    .order("created_at", { ascending: true })

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center gap-3 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-2 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
          <Link href="/learn/notebooks">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="font-semibold text-foreground truncate">{notebook.title}</h1>
      </header>
      <NotebookView
        notebookId={id}
        notebookTitle={notebook.title}
        initialSources={sources ?? []}
      />
    </div>
  )
}
