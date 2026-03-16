import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KnowledgeGraph } from "@/components/knowledge/knowledge-graph"
import { getSessionOrBypass } from "@/lib/auth"

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's knowledge nodes
  const { data: nodes } = await supabase
    .from("knowledge_nodes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch knowledge edges
  const { data: edges } = await supabase.from("knowledge_edges").select("*").eq("user_id", user.id)

  // Fetch belief contradictions
  const { data: contradictions } = await supabase
    .from("belief_contradictions")
    .select("*")
    .eq("user_id", user.id)
    .eq("resolution_status", "unresolved")

  return (
    <KnowledgeGraph nodes={nodes || []} edges={edges || []} contradictions={contradictions || []} userId={user.id} />
  )
}
