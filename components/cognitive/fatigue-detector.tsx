"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Battery, BatteryLow, BatteryMedium, Coffee, Brain, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface FatigueState {
  level: number // 0-100, 100 = fully energized
  interactions: number
  sessionDuration: number // minutes
  lastBreak: Date | null
  conceptsIntroduced: number
}

interface FatigueDetectorProps {
  onTakeBreak?: () => void
  onSlowDown?: () => void
}

export function FatigueDetector({ onTakeBreak, onSlowDown }: FatigueDetectorProps) {
  const t = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [fatigueState, setFatigueState] = useState<FatigueState>({
    level: 100,
    interactions: 0,
    sessionDuration: 0,
    lastBreak: null,
    conceptsIntroduced: 0,
  })
  const [suggestion, setSuggestion] = useState<"break" | "slowdown" | null>(null)

  // Simulate fatigue tracking (in real app, this would track actual interactions)
  useEffect(() => {
    const interval = setInterval(() => {
      setFatigueState((prev) => {
        const newDuration = prev.sessionDuration + 1
        const timeSinceBreak = prev.lastBreak ? (Date.now() - prev.lastBreak.getTime()) / 1000 / 60 : newDuration

        // Calculate fatigue based on various factors
        let newLevel = prev.level

        // Decrease over time
        if (newDuration > 20) newLevel -= 0.5
        if (newDuration > 40) newLevel -= 1

        // High interaction count increases fatigue
        if (prev.interactions > 10) newLevel -= 0.3
        if (prev.interactions > 20) newLevel -= 0.5

        // Many new concepts introduced
        if (prev.conceptsIntroduced > 5) newLevel -= 0.2

        // Recovery if recently had break
        if (timeSinceBreak < 5 && prev.lastBreak) newLevel += 0.5

        newLevel = Math.max(0, Math.min(100, newLevel))

        return {
          ...prev,
          sessionDuration: newDuration,
          level: newLevel,
        }
      })
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Show suggestions based on fatigue level
  useEffect(() => {
    if (fatigueState.level < 30) {
      setSuggestion("break")
      setIsVisible(true)
    } else if (fatigueState.level < 50) {
      setSuggestion("slowdown")
      setIsVisible(true)
    } else {
      setSuggestion(null)
    }
  }, [fatigueState.level])

  const getBatteryIcon = () => {
    if (fatigueState.level > 60) return Battery
    if (fatigueState.level > 30) return BatteryMedium
    return BatteryLow
  }

  const getColor = () => {
    if (fatigueState.level > 60) return "text-green-500"
    if (fatigueState.level > 30) return "text-yellow-500"
    return "text-red-500"
  }

  const BatteryIcon = getBatteryIcon()

  // Track interactions from outside
  const trackInteraction = () => {
    setFatigueState((prev) => ({
      ...prev,
      interactions: prev.interactions + 1,
    }))
  }

  const trackNewConcept = () => {
    setFatigueState((prev) => ({
      ...prev,
      conceptsIntroduced: prev.conceptsIntroduced + 1,
    }))
  }

  const handleTakeBreak = () => {
    setFatigueState((prev) => ({
      ...prev,
      level: Math.min(100, prev.level + 30),
      lastBreak: new Date(),
    }))
    setIsVisible(false)
    onTakeBreak?.()
  }

  const handleSlowDown = () => {
    setIsVisible(false)
    onSlowDown?.()
  }

  if (!isVisible || !suggestion) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-fade-in-up">
      <Card className="w-80 shadow-xl border-border/50 bg-card/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <BatteryIcon className={cn("h-5 w-5", getColor())} />
              <span className="font-medium">
                {suggestion === "break" ? t.cognitive.fatigueDetected : t.cognitive.overloadWarning}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Energy Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.cognitive.attentionBudget}</span>
              <span className={cn("font-medium", getColor())}>{Math.round(fatigueState.level)}%</span>
            </div>
            <Progress value={fatigueState.level} className="h-2" />
          </div>

          {/* Suggestion */}
          <p className="text-sm text-muted-foreground mb-4">
            {suggestion === "break" ? t.cognitive.takeBreak : t.cognitive.slowingDown}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            {suggestion === "break" ? (
              <>
                <Button onClick={handleTakeBreak} className="flex-1 bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
                  <Coffee className="h-4 w-4 mr-2" />
                  Take Break
                </Button>
                <Button variant="outline" onClick={() => setIsVisible(false)} className="bg-transparent">
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSlowDown} className="flex-1 bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
                  <Brain className="h-4 w-4 mr-2" />
                  One at a Time
                </Button>
                <Button variant="outline" onClick={() => setIsVisible(false)} className="bg-transparent">
                  Keep Going
                </Button>
              </>
            )}
          </div>

          {/* Session Info */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <span>{fatigueState.sessionDuration} min session</span>
            <span>{fatigueState.interactions} interactions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for tracking fatigue externally
export function useFatigueTracking() {
  const [interactions, setInteractions] = useState(0)
  const [concepts, setConcepts] = useState(0)

  const trackInteraction = () => setInteractions((i) => i + 1)
  const trackNewConcept = () => setConcepts((c) => c + 1)

  return { interactions, concepts, trackInteraction, trackNewConcept }
}
