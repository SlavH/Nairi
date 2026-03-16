"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ConfidenceIndicatorProps {
  confidence: number // 0-1
  showLabel?: boolean
}

export function ConfidenceIndicator({ confidence, showLabel = false }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)

  const getColor = () => {
    if (confidence >= 0.8) return "text-green-500"
    if (confidence >= 0.6) return "text-yellow-500"
    return "text-orange-500"
  }

  const getLabel = () => {
    if (confidence >= 0.8) return "High confidence"
    if (confidence >= 0.6) return "Moderate confidence"
    return "Lower confidence"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1 text-xs min-h-[44px] sm:min-h-0 items-center cursor-help touch-manipulation py-2 sm:py-0", getColor())} role="img" aria-label={getLabel()}>
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", {
                  "bg-green-500": confidence >= 0.8,
                  "bg-yellow-500": confidence >= 0.6 && confidence < 0.8,
                  "bg-orange-500": confidence < 0.6,
                })}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {showLabel && <span>{percentage}%</span>}
            <Info className="h-3 w-3 opacity-50" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{getLabel()}</p>
          <p className="text-xs text-muted-foreground">AI confidence in this response</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
