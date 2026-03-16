"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Zap, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageIndicatorProps {
  featureType?: 'text' | 'image' | 'video' | 'code' | 'website'
  className?: string
  compact?: boolean
}

interface UsageLimits {
  used: number
  limit: number
  resetTime: Date
}

const DEFAULT_LIMITS = {
  free: {
    text: 50,
    image: 10,
    video: 3,
    code: 30,
    website: 5
  },
  pro: {
    text: 500,
    image: 100,
    video: 30,
    code: 300,
    website: 50
  }
}

export function UsageIndicator({ featureType = 'text', className, compact = false }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<UsageLimits>({
    used: 0,
    limit: DEFAULT_LIMITS.free[featureType],
    resetTime: new Date(Date.now() + 3600000) // 1 hour from now
  })
  const [tier, setTier] = useState<'free' | 'pro'>('free')

  // Simulate fetching usage data
  useEffect(() => {
    // In production, this would fetch from API
    const storedUsage = localStorage.getItem(`nairi_usage_${featureType}`)
    if (storedUsage) {
      const parsed = JSON.parse(storedUsage)
      setUsage({
        ...parsed,
        resetTime: new Date(parsed.resetTime)
      })
    }
  }, [featureType])

  const percentage = Math.min((usage.used / usage.limit) * 100, 100)
  const remaining = Math.max(usage.limit - usage.used, 0)
  const isWarning = percentage >= 80
  const isExhausted = percentage >= 100

  const getTimeUntilReset = () => {
    const now = new Date()
    const diff = usage.resetTime.getTime() - now.getTime()
    if (diff <= 0) return 'Resetting...'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1.5 cursor-pointer", className)}>
              <Zap className={cn(
                "h-3.5 w-3.5",
                isExhausted ? "text-red-500" : isWarning ? "text-yellow-500" : "text-emerald-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isExhausted ? "text-red-500" : isWarning ? "text-yellow-500" : "text-muted-foreground"
              )}>
                {remaining}/{usage.limit}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{featureType} Requests</span>
                <Badge variant={tier === 'pro' ? 'default' : 'secondary'} className="text-xs">
                  {tier.toUpperCase()}
                </Badge>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{remaining} remaining</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Resets in {getTimeUntilReset()}
                </span>
              </div>
              {isWarning && !isExhausted && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </div>
              )}
              {isExhausted && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Limit reached. Upgrade for more.</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-card p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={cn(
            "h-4 w-4",
            isExhausted ? "text-red-500" : isWarning ? "text-yellow-500" : "text-emerald-500"
          )} />
          <span className="text-sm font-medium capitalize">{featureType} Requests</span>
        </div>
        <Badge variant={tier === 'pro' ? 'default' : 'secondary'} className="text-xs">
          {tier.toUpperCase()}
        </Badge>
      </div>
      
      <Progress 
        value={percentage} 
        className={cn(
          "h-2",
          isExhausted ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-yellow-500" : ""
        )} 
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(
          isExhausted ? "text-red-500 font-medium" : isWarning ? "text-yellow-500" : ""
        )}>
          {remaining} of {usage.limit} remaining
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Resets in {getTimeUntilReset()}
        </span>
      </div>

      {isWarning && !isExhausted && (
        <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 rounded px-2 py-1">
          <AlertTriangle className="h-3 w-3" />
          <span>You're approaching your hourly limit</span>
        </div>
      )}

      {isExhausted && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-500 bg-red-500/10 rounded px-2 py-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            <span>Limit reached</span>
          </div>
          <button className="text-primary hover:underline font-medium">
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  )
}

// Hook to track and increment usage
export function useUsageTracker(featureType: 'text' | 'image' | 'video' | 'code' | 'website') {
  const [canMakeRequest, setCanMakeRequest] = useState(true)

  const incrementUsage = () => {
    const key = `nairi_usage_${featureType}`
    const stored = localStorage.getItem(key)
    const limit = DEFAULT_LIMITS.free[featureType]
    
    let usage = stored ? JSON.parse(stored) : {
      used: 0,
      limit,
      resetTime: new Date(Date.now() + 3600000).toISOString()
    }

    // Check if reset time has passed
    if (new Date(usage.resetTime) < new Date()) {
      usage = {
        used: 0,
        limit,
        resetTime: new Date(Date.now() + 3600000).toISOString()
      }
    }

    usage.used += 1
    localStorage.setItem(key, JSON.stringify(usage))
    
    setCanMakeRequest(usage.used < usage.limit)
    return usage.used < usage.limit
  }

  const checkCanMakeRequest = () => {
    const key = `nairi_usage_${featureType}`
    const stored = localStorage.getItem(key)
    if (!stored) return true
    
    const usage = JSON.parse(stored)
    
    // Check if reset time has passed
    if (new Date(usage.resetTime) < new Date()) {
      return true
    }
    
    return usage.used < usage.limit
  }

  useEffect(() => {
    setCanMakeRequest(checkCanMakeRequest())
  }, [featureType])

  return { canMakeRequest, incrementUsage, checkCanMakeRequest }
}
