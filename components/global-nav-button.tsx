"use client"

import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavOverlay } from "@/components/dashboard/nav-overlay-context"

/**
 * Fixed-position button on every page (except /nav) that opens the circular nav overlay.
 * Hidden on /dashboard* so it does not overlap the sidebar hamburger (left-4 top-4); use header "Open navigation hub" there.
 * See docs/DESIGN_SYSTEM.md — Responsiveness.
 */
export function GlobalNavButton() {
  const pathname = usePathname()
  const navOverlay = useNavOverlay()

  if (pathname === "/nav" || pathname.startsWith("/dashboard") || !navOverlay) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={navOverlay.openNavOverlay}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-[100] h-12 w-12 rounded-full border border-border bg-card/80 backdrop-blur-md text-foreground hover:bg-card hover:border-[#e879f9]/50 hover:text-[#e879f9] transition-all shadow-lg"
      aria-label="Open navigation hub"
      title="Open navigation"
    >
      <ArrowRight className="h-5 w-5 rotate-180" />
    </Button>
  )
}
