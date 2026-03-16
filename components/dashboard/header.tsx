"use client"

import { Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n/context"
import { useNavOverlay } from "@/components/dashboard/nav-overlay-context"
interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: string | null
  tokens_balance: number | null
}

export function DashboardHeader({ user, profile }: { user: { id: string; email?: string | null } | null; profile: Profile | null }) {
  const { t } = useTranslation()
  const navOverlay = useNavOverlay()
  
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between pl-14 pr-4 sm:px-6 lg:pl-8 lg:pr-8">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {navOverlay && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full min-h-[44px] min-w-[44px]"
          onClick={navOverlay.openNavOverlay}
          aria-label={t.common.openNavigationHub}
          title={t.common.openNavigationHub}
        >
          <ArrowLeft className="h-5 w-5 rotate-180" />
        </Button>
        )}
      <form action="/search" method="GET" className="flex-1 max-w-md ml-2 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder={t.dashboard.searchPlaceholder}
            className="pl-10 bg-background/50"
            aria-label={t.dashboard.searchPlaceholder}
          />
        </div>
      </form>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="minimal" />
        <NotificationBell />

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#e052a0]/20 to-[#00c9c8]/20">
          <span className="text-xs text-muted-foreground">{t.dashboard.plan}:</span>
          <span className="text-sm font-medium text-foreground capitalize">{profile?.subscription_tier || t.dashboard.free}</span>
        </div>
      </div>
    </header>
  )
}
