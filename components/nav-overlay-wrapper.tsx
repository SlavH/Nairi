"use client"

import { NavOverlayProvider } from "@/components/dashboard/nav-overlay-context"
import { NavOverlay } from "@/components/dashboard/nav-overlay"
import { GlobalNavButton } from "@/components/global-nav-button"
import { PageTransition } from "@/components/page-transition"

export function NavOverlayWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NavOverlayProvider>
      <NavOverlay />
      <GlobalNavButton />
      <PageTransition>{children}</PageTransition>
    </NavOverlayProvider>
  )
}
