import {
  Presentation,
  Globe,
  FileText,
  Palette,
  Code,
  BarChart3,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { CreateForm, type CreateTypeOption } from "@/components/workspace/create-form"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"


const creationTypes: (CreateTypeOption & { icon: React.ComponentType<{ className?: string }>; color: string })[] = [
  { id: "presentation", label: "Presentation", icon: Presentation, color: "from-orange-500 to-red-500", description: "Create professional presentations with AI" },
  { id: "website", label: "Website", icon: Globe, color: "from-blue-500 to-cyan-500", description: "Build responsive websites from descriptions" },
  { id: "document", label: "Document", icon: FileText, color: "from-green-500 to-emerald-500", description: "Generate documents, reports, and proposals" },
  { id: "visual", label: "Visual Design", icon: Palette, color: "from-pink-500 to-rose-500", description: "Create diagrams, posters, and graphics" },
  { id: "code", label: "Code", icon: Code, color: "from-slate-500 to-zinc-600", description: "Write and debug code in any language" },
  { id: "analysis", label: "Analysis", icon: BarChart3, color: "from-indigo-500 to-violet-500", description: "Data analysis and visualization" },
]

const simulationOption = { id: "simulation", label: "Simulation", icon: Zap, color: "from-yellow-500 to-lime-500", description: "Interactive simulations have a dedicated studio" }

interface CreatePageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const supabase = await createClient()
  const user = await getSession(() => supabase.auth.getUser())

  if (!user) {
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
          <CreateForm type={selectedType} onBack={() => history.back()} />
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
              <a
                href="/simulations"
                className="flex flex-col items-start gap-3 p-4 rounded-xl border border-border hover:border-[#e879f9]/50 bg-background/50 hover:bg-background transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${simulationOption.color} flex items-center justify-center`}>
                  <simulationOption.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{simulationOption.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{simulationOption.description}</p>
                </div>
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
