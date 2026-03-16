"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  Home,
  MessageSquare,
  Store,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Network,
  Activity,
  FolderOpen,
  Shield,
  Bell,
  Zap,
  Gift,
  Presentation,
  Code,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: string | null
  tokens_balance: number | null
}

function useNavItems() {
  const { t } = useTranslation()
  return [
    { href: "/dashboard", icon: Home, label: t.nav.dashboard },
    { href: "/chat", icon: MessageSquare, label: t.nav.chat },
    { href: "/presentations", icon: Presentation, label: "Presentations" },
    { href: "/workspace", icon: FolderOpen, label: t.dashboard.workspace },
    { href: "/builder-v2", icon: Code, label: t.dashboard.builder },
    { href: "/learn", icon: GraduationCap, label: t.nav.learn },
    { href: "/flow", icon: GitBranch, label: t.nav.flow },
    { href: "/knowledge", icon: Network, label: t.nav.knowledge },
    { href: "/marketplace", icon: Store, label: t.nav.marketplace },
    { href: "/dashboard/activity", icon: Activity, label: t.dashboard.activity },
    { href: "/dashboard/traces", icon: Shield, label: t.dashboard.executionTraces },
    { href: "/dashboard/notifications", icon: Bell, label: t.dashboard.notifications },
    { href: "/dashboard/credits", icon: Zap, label: t.dashboard.creditsRewards },
    { href: "/dashboard/earn", icon: Gift, label: "Earn Credits" },
    { href: "/dashboard/billing", icon: CreditCard, label: t.nav.billing },
    { href: "/dashboard/settings", icon: Settings, label: t.nav.settings },
  ]
}

export function DashboardSidebar({ user, profile }: { user?: { id: string; email?: string | null } | null; profile?: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const navItems = useNavItems()
  const { t } = useTranslation()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <>
      {/* Mobile menu button — 44px min touch target on mobile (DESIGN_SYSTEM) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 h-12 w-12 min-h-[44px] min-w-[44px] lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={isOpen}
        aria-controls="dashboard-sidebar"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Dashboard navigation"
        aria-modal={isOpen}
      >
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={40} height={40} />
            <span className="text-xl font-bold bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent">
              Nairi
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Check if this nav item is active
            // Exact match for /dashboard, prefix match for others
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-[#e052a0]/20 to-[#00c9c8]/20 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <Link
            href="/dashboard/credits"
            className="block px-4 py-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
          >
            <p className="text-xs text-muted-foreground">{t.dashboard.tokensBalance}</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{profile?.tokens_balance ?? 100}</p>
              <Zap className="h-4 w-4 text-[#e879f9]" />
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-3 px-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-white font-medium">
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {t.common.signOut}
          </Button>
        </div>
      </aside>
    </>
  )
}
