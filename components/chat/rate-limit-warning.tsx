"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RateLimitWarningProps {
  featureType?: 'text' | 'image' | 'video' | 'code' | 'website'
  onUpgrade?: () => void
  onDismiss?: () => void
  className?: string
}

export function RateLimitWarning({ 
  featureType = 'text', 
  onUpgrade, 
  onDismiss,
  className 
}: RateLimitWarningProps) {
  const [countdown, setCountdown] = useState<string>('')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const key = `nairi_usage_${featureType}`
    const stored = localStorage.getItem(key)
    
    if (!stored) {
      setIsVisible(false)
      return
    }

    const usage = JSON.parse(stored)
    const resetTime = new Date(usage.resetTime)

    const updateCountdown = () => {
      const now = new Date()
      const diff = resetTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setCountdown('Resetting...')
        // Clear usage after reset
        localStorage.removeItem(key)
        setTimeout(() => setIsVisible(false), 1000)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      
      if (minutes < 60) {
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      } else {
        const hours = Math.floor(minutes / 60)
        setCountdown(`${hours}h ${minutes % 60}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [featureType])

  if (!isVisible) return null

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-red-500">
            Rate Limit Reached
          </p>
          <p className="text-xs text-muted-foreground">
            You've used all your {featureType} requests for this hour
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md bg-background/50 px-3 py-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono font-medium">{countdown}</span>
        </div>
        
        <Button 
          size="sm" 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Upgrade
        </Button>
      </div>

      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false)
            onDismiss()
          }}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-background/50"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

// Modal version for when limit is reached
export function RateLimitModal({ 
  featureType = 'text',
  isOpen,
  onClose,
  onUpgrade
}: {
  featureType?: 'text' | 'image' | 'video' | 'code' | 'website'
  isOpen: boolean
  onClose: () => void
  onUpgrade?: () => void
}) {
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    const key = `nairi_usage_${featureType}`
    const stored = localStorage.getItem(key)
    
    if (!stored) return

    const usage = JSON.parse(stored)
    const resetTime = new Date(usage.resetTime)

    const updateCountdown = () => {
      const now = new Date()
      const diff = resetTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setCountdown('Resetting...')
        onClose()
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [isOpen, featureType, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Rate Limit Reached</h3>
            <p className="text-sm text-muted-foreground">
              You've used all your {featureType} requests for this hour.
              Wait for the timer to reset or upgrade to Pro for more requests.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-mono font-bold">{countdown}</span>
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Wait
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={onUpgrade}
            >
              <Zap className="mr-1.5 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
