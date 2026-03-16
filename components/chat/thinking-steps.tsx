"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  MessageSquareIcon,
  SearchIcon,
  CpuIcon,
  SparklesIcon as Sparkles,
  FileTextIcon,
} from "@/lib/icons"

const STEPS = [
  { id: "understand", label: "Understanding your question", icon: MessageSquareIcon },
  { id: "search", label: "Searching", icon: SearchIcon },
  { id: "analyze", label: "Reading & analyzing", icon: CpuIcon },
  { id: "formulate", label: "Thinking", icon: Sparkles },
  { id: "writing", label: "Writing", icon: FileTextIcon },
] as const

const ROTATE_MS = 2400

/**
 * Gemini-style status: single compact line showing what Nairi is doing right now.
 */
export function ThinkingSteps() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % STEPS.length)
    }, ROTATE_MS)
    return () => clearInterval(t)
  }, [])

  const step = STEPS[activeIndex]
  const Icon = step.icon

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={`Nairi: ${step.label}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm text-muted-foreground">{step.label}</span>
      <span
        className={cn(
          "ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse"
        )}
        aria-hidden
      />
    </div>
  )
}
