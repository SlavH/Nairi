"use client"

import { AlertTriangle, X, Zap, Clock, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LimitCardProps {
  type: "rate-limit" | "vision-error" | "photo-check" | "exercises" | "problem-solver"
  title: string
  message: string
  action?: () => void
  actionLabel?: string
  countdown?: string
  retryAfter?: number
  onDismiss?: () => void
}

export function LimitCard({ type, title, message, action, actionLabel, countdown, retryAfter, onDismiss }: LimitCardProps) {
  const getIcon = () => {
    switch (type) {
      case "rate-limit":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "vision-error":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "photo-check":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "exercises":
        return <Zap className="h-5 w-5 text-blue-500" />
      case "problem-solver":
        return <Zap className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case "rate-limit":
        return "border-amber-500/30 bg-amber-500/10"
      case "vision-error":
        return "border-orange-500/30 bg-orange-500/10"
      case "photo-check":
        return "border-red-500/30 bg-red-500/10"
      case "exercises":
        return "border-blue-500/30 bg-blue-500/10"
      case "problem-solver":
        return "border-purple-500/30 bg-purple-500/10"
      default:
        return "border-muted/30 bg-muted/10"
    }
  }

  const getTitleColor = () => {
    switch (type) {
      case "rate-limit":
        return "text-amber-600 dark:text-amber-400"
      case "vision-error":
        return "text-orange-600 dark:text-orange-400"
      case "photo-check":
        return "text-red-600 dark:text-red-400"
      case "exercises":
        return "text-blue-600 dark:text-blue-400"
      case "problem-solver":
        return "text-purple-600 dark:text-purple-400"
      default:
        return "text-foreground"
    }
  }

  return (
    <Card className={`border-2 transition-all duration-300 ${getBorderColor()}`}
      style={{ borderColor: getBorderColor().split(' ')[0].replace('border-', '') }}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg" style={{ color: getTitleColor().split(' ')[0].replace('text-', '') }}>{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </CardDescription>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {(countdown || retryAfter) && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium">
              {countdown || `Retry in ${retryAfter}s`}
            </span>
          </div>
        </CardContent>
      )}

      {action && (
        <CardContent className="pt-0">
          <Button
            onClick={action}
            className="w-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] hover:from-[#22d3ee]/90 hover:to-[#a78bfa]/90 text-white"
          >
            <Zap className="mr-2 h-4 w-4" />
            {actionLabel || "Try Again"}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
