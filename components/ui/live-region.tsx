"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LiveRegionProps {
  children: React.ReactNode
  /** ARIA live region politeness level */
  politeness?: "polite" | "assertive" | "off"
  /** Whether to announce atomic changes */
  atomic?: boolean
  /** Whether content is relevant (ARIA allows space-separated e.g. "additions text") */
  relevant?: "additions" | "removals" | "text" | "all" | "additions text"
  /** Additional CSS classes */
  className?: string
  /** Role for the live region */
  role?: "status" | "alert" | "log" | "timer"
}

/**
 * LiveRegion Component
 * 
 * Announces dynamic content changes to screen readers.
 * Use this for:
 * - Chat messages
 * - Form validation errors
 * - Loading states
 * - Success/error notifications
 * - Dynamic content updates
 * 
 * @example
 * // For chat messages (polite, don't interrupt)
 * <LiveRegion politeness="polite" role="log">
 *   {lastMessage}
 * </LiveRegion>
 * 
 * @example
 * // For errors (assertive, interrupt immediately)
 * <LiveRegion politeness="assertive" role="alert">
 *   {errorMessage}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  politeness = "polite",
  atomic = false,
  relevant = "additions text",
  className,
  role = "status",
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Ensure the live region is properly initialized
    if (regionRef.current) {
      // Force screen readers to recognize the live region
      regionRef.current.setAttribute("aria-live", politeness)
    }
  }, [politeness])

  return (
    <div
      ref={regionRef}
      role={role}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        // Visually hidden but accessible to screen readers
        "sr-only",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * VisibleLiveRegion Component
 * 
 * Same as LiveRegion but visible on screen.
 * Use when the content should be both seen and announced.
 */
export function VisibleLiveRegion({
  children,
  politeness = "polite",
  atomic = false,
  relevant = "additions text",
  className,
  role = "status",
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (regionRef.current) {
      regionRef.current.setAttribute("aria-live", politeness)
    }
  }, [politeness])

  return (
    <div
      ref={regionRef}
      role={role}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  )
}
