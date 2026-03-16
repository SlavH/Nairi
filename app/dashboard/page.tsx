import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageSquare, Store, Zap, TrendingUp, Clock, Bot } from "lucide-react"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { redirect } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

  const { data: userAgents } = await supabase.from("user_agents").select("*, agents(*)").eq("user_id", user.id)

  const { data: freeAgents } = await supabase.from("agents").select("*").eq("is_free", true).limit(3)

  const { count: creationsCount } = await supabase.from("creations").select("*", { count: "exact", head: true }).eq("user_id", user.id)

  return (
    <DashboardContent 
      profile={profile}
      conversations={conversations ?? []}
      userAgents={userAgents ?? []}
      freeAgents={freeAgents ?? []}
      creationsCount={creationsCount ?? 0}
    />
  )
}
