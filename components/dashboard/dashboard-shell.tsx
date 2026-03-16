"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { BreadcrumbNav } from "@/components/navigation/breadcrumb-nav"
interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: string | null
  tokens_balance: number | null
}

/** Minimal user shape so shell works with both real Supabase user and bypass user */
export type ShellUser = { id: string; email?: string | null } | null

export function DashboardShell({
  user,
  profile,
  children,
}: {
  user: ShellUser
  profile: Profile | null
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-950 via-pink-950 to-cyan-950">
      <div className="h-full w-full p-2 sm:p-3 md:p-4 flex gap-2 sm:gap-3">
        <div className="hidden lg:block shrink-0">
          <div className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
            <DashboardSidebar user={user} profile={profile} />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
            <DashboardHeader user={user} profile={profile} />
            <main className="flex-1 p-4 sm:p-6 overflow-auto min-w-0 min-h-0">
              <BreadcrumbNav className="mb-4" />
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
