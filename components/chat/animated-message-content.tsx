"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedMessageContentProps {
  text: string
  isStreaming: boolean
  renderContent: (visibleText: string) => React.ReactNode
  messageId: string
  className?: string
}

/** Chars to reveal per animation frame so text keeps up with stream (ChatGPT-like). */
const CHARS_PER_FRAME = 2

/**
 * ChatGPT-style streaming: text appears smoothly character-by-character as it streams,
 * with a blinking cursor at the end. Fast catch-up so text doesn't lag behind the stream.
 */
export function AnimatedMessageContent({
  text,
  isStreaming,
  renderContent,
  messageId,
  className,
}: AnimatedMessageContentProps) {
  const [visibleLength, setVisibleLength] = useState(0)
  const prevMessageIdRef = useRef(messageId)
  const rafRef = useRef<number>(0)
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (prevMessageIdRef.current !== messageId) {
      prevMessageIdRef.current = messageId
      setVisibleLength(0)
    }
  }, [messageId])

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLength(text.length)
      return
    }
    const target = text.length
    if (target === 0) {
      setVisibleLength(0)
      return
    }
    let cancelled = false
    const step = () => {
      if (cancelled) return
      setVisibleLength((prev) => {
        if (prev >= target) return prev
        const next = Math.min(prev + CHARS_PER_FRAME, target)
        if (next < target) rafRef.current = requestAnimationFrame(step)
        return next
      })
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [text, prefersReducedMotion])

  useEffect(() => {
    if (!isStreaming && text.length > 0) setVisibleLength(text.length)
  }, [isStreaming, text.length])

  const visibleText = prefersReducedMotion ? text : text.slice(0, visibleLength)
  const showCursor = isStreaming && visibleLength >= text.length

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words overflow-x-auto",
          visibleLength === 0 && text.length > 0 && "opacity-70"
        )}
      >
        {renderContent(visibleText)}
      </div>
      {showCursor && (
        <span
          className="ml-0.5 inline-block h-4 w-[2px] animate-cursor-blink rounded-sm bg-primary align-middle"
          aria-hidden
        />
      )}
    </div>
  )
}
