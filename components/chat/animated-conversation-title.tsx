"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

const TYPEWRITER_MS = 26

interface AnimatedConversationTitleProps {
  title: string
  className?: string
}

/**
 * Shows conversation title. When it changes from "New Conversation" to a generated name,
 * reveals the new title with a typewriter animation.
 */
export function AnimatedConversationTitle({ title, className }: AnimatedConversationTitleProps) {
  const [visibleLength, setVisibleLength] = useState(title.length)
  const prevTitleRef = useRef(title)

  useEffect(() => {
    if (title === "New Conversation") {
      setVisibleLength(title.length)
      prevTitleRef.current = title
      return
    }
    if (prevTitleRef.current === "New Conversation" && title !== "New Conversation") {
      prevTitleRef.current = title
      setVisibleLength(0)
      return
    }
    prevTitleRef.current = title
    setVisibleLength(title.length)
  }, [title])

  useEffect(() => {
    if (title === "New Conversation" || visibleLength >= title.length) return
    const t = setInterval(() => {
      setVisibleLength((prev) => Math.min(prev + 1, title.length))
    }, TYPEWRITER_MS)
    return () => clearInterval(t)
  }, [title, visibleLength])

  const isTypewriting = title !== "New Conversation" && visibleLength < title.length
  const displayTitle = isTypewriting ? title.slice(0, visibleLength) : title

  return (
    <span className={cn("inline-block", className)} title={title}>
      {displayTitle}
      {isTypewriting && (
        <span
          className="ml-px inline-block h-3.5 w-[2px] animate-cursor-blink rounded-sm bg-primary align-middle"
          aria-hidden
        />
      )}
    </span>
  )
}
