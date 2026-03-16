import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionOrBypass } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Workspace | Nairi",
  description: "Your workspace",
}

const LAYOUT_TIMEOUT_MS = 10_000

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const result = await Promise.race([
      (async () => {
        const supabase = await createClient()
        const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
        if (!user) redirect("/auth/login")
        return user
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Workspace layout timeout")), LAYOUT_TIMEOUT_MS)
      ),
    ])
    void result
  } catch {
    redirect("/auth/login")
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-950 via-pink-950 to-cyan-950">
      <div className="h-full w-full p-2 sm:p-3 md:p-4">
        <div className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
