"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface NavOverlayContextValue {
  navOverlayOpen: boolean
  setNavOverlayOpen: (open: boolean) => void
  openNavOverlay: () => void
  closeNavOverlay: () => void
}

const NavOverlayContext = createContext<NavOverlayContextValue | null>(null)

export function NavOverlayProvider({ children }: { children: React.ReactNode }) {
  const [navOverlayOpen, setNavOverlayOpen] = useState(false)
  const openNavOverlay = useCallback(() => setNavOverlayOpen(true), [])
  const closeNavOverlay = useCallback(() => setNavOverlayOpen(false), [])

  return (
    <NavOverlayContext.Provider
      value={{
        navOverlayOpen,
        setNavOverlayOpen,
        openNavOverlay,
        closeNavOverlay,
      }}
    >
      {children}
    </NavOverlayContext.Provider>
  )
}

export function useNavOverlay(): NavOverlayContextValue | null {
  return useContext(NavOverlayContext)
}
