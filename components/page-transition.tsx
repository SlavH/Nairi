"use client"

import { motion, useReducedMotion } from "framer-motion"
import { usePathname } from "next/navigation"

/**
 * Optional lightweight route-level transition (Phase 414).
 * Fades content in on route change; respects prefers-reduced-motion.
 * Always renders children immediately - never blocks rendering.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  // Always render children immediately - no conditions that block rendering
  if (reduced) {
    return <>{children}</>
  }

  // Use pathname as key for route transitions, but always show content
  return (
    <motion.div
      key={pathname || "root"}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      style={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  )
}
