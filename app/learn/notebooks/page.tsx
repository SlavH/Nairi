import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSessionOrBypass } from "@/lib/auth"
import { LearnNotebooksList } from "@/components/learn/learn-notebooks-list"

export default async function LearnNotebooksPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
  if (!user) redirect("/auth/login")

  const { data: notebooks } = await supabase
    .from("learn_notebooks")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
            <Link href="/nav" aria-label="Back to navigation">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">NairiBook</h1>
            <p className="text-xs text-muted-foreground">Add sources, then ask questions grounded in your materials.</p>
          </div>
        </div>
        <LearnNotebooksList initialNotebooks={notebooks ?? []} />
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {(notebooks?.length ?? 0) === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <p className="text-muted-foreground mb-4">Create a NairiBook and add sources (pasted text or URLs). Then chat with AI that answers only from your sources, with citations.</p>
            <LearnNotebooksList initialNotebooks={[]} showCreateButton />
          </div>
        ) : (
          <ul className="space-y-2">
            {(notebooks ?? []).map((nb) => (
              <li key={nb.id}>
                <Link
                  href={`/learn/notebooks/${nb.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <span className="font-medium text-foreground">{nb.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(nb.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
