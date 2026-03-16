"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { CircularNavigation } from "@/components/dashboard/circular-nav"
import { useNavOverlay } from "@/components/dashboard/nav-overlay-context"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n/context"

/**
 * Renders the circular nav as an overlay on top of the current page with blurred background.
 * Used when the user clicks the undo arrow on any dashboard page.
 */
export function NavOverlay() {
  const navOverlay = useNavOverlay()
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const { t } = useTranslation()
  const open = navOverlay?.navOverlayOpen ?? false
  const closeNavOverlay = navOverlay?.closeNavOverlay ?? (() => {})

  // Close overlay when user navigates (e.g. by clicking a nav circle)
  useEffect(() => {
    if (!navOverlay) return
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      closeNavOverlay()
    }
  }, [pathname, closeNavOverlay, navOverlay])

  if (!navOverlay || !open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.common.openNavigationHub}>
      {/* Blurred background (current page) */}
      <div
        className="absolute inset-0 backdrop-blur-xl bg-black/60"
        onClick={closeNavOverlay}
        onKeyDown={(e) => e.key === "Escape" && closeNavOverlay()}
        aria-hidden
      />
      {/* Top bar: language switcher + close */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <LanguageSwitcher variant="minimal" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 min-h-[44px] min-w-[44px] rounded-full bg-black/50 text-white hover:bg-white/20 border border-white/20 transition-opacity duration-150 pointer-events-auto"
          onClick={closeNavOverlay}
          aria-label={t.common.closeNavigation}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* Circular nav on top */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
        <CircularNavigation />
      </div>
    </div>
  )
}
