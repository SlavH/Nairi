"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/**
 * Thin progress bar at the top of the viewport that animates on route change.
 * Addresses nairi_v34_res performance recommendation: "Add page transition loading indicators".
 */
export function TopProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const prevPathname = useRef(pathname)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    setVisible(true)
    setProgress(0)

    const start = performance.now()
    const duration = 320

    const tick = (now: number) => {
      const elapsed = now - start
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setVisible(false)
        setProgress(0)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-gradient-to-r from-[#e879f9] to-[#22d3ee] transition-opacity duration-150"
      style={{ transform: `scaleX(${progress / 100})`, transformOrigin: "0 0" }}
      aria-hidden
    />
  )
}
