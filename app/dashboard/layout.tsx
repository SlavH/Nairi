import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getSessionOrBypass } from "@/lib/auth"

const LAYOUT_TIMEOUT_MS = 10_000

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: { id: string; email?: string | null }
  let profile: unknown

  try {
    const result = await Promise.race([
      (async () => {
        const supabase = await createClient()
        const { user: u } = await getSessionOrBypass(() => supabase.auth.getUser())
        if (!u) redirect("/auth/login")
        const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single()
        return { user: u, profile: p }
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Dashboard layout timeout")), LAYOUT_TIMEOUT_MS)
      ),
    ])
    user = result.user
    profile = result.profile
  } catch {
    redirect("/auth/login")
  }

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  )
}
