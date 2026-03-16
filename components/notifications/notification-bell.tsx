"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, Trash2, X, Zap, Gift, Shield, AlertTriangle, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import useSWR from "swr"
import { toast } from "sonner"
import { LiveRegion } from "@/components/ui/live-region"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error" | "system" | "achievement" | "referral" | "credits"
  title: string
  message: string
  action_url?: string
  action_label?: string
  read: boolean
  created_at: string
}

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertTriangle,
  system: Bell,
  achievement: Sparkles,
  referral: Gift,
  credits: Zap
}

const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  error: "bg-red-500/10 text-red-500",
  system: "bg-slate-500/10 text-slate-400",
  achievement: "bg-purple-500/10 text-purple-500",
  referral: "bg-pink-500/10 text-pink-500",
  credits: "bg-cyan-500/10 text-cyan-500"
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 }
  )

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids })
      })
      mutate()
      setStatusMessage(`${ids.length} notification${ids.length > 1 ? 's' : ''} marked as read`)
    } catch (error) {
      toast.error("Failed to mark notifications as read")
      setStatusMessage("Error: Failed to mark notifications as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true })
      })
      mutate()
      toast.success("All notifications marked as read")
      setStatusMessage("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all as read")
      setStatusMessage("Error: Failed to mark all as read")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
      mutate()
      setStatusMessage("Notification deleted")
    } catch (error) {
      toast.error("Failed to delete notification")
      setStatusMessage("Error: Failed to delete notification")
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = data?.unreadCount || 0
  const notifications = data?.notifications || []

  return (
    <>
      <LiveRegion politeness="polite" role="status">{statusMessage}</LiveRegion>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-[#e879f9] text-white border-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl" align="end">
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm rounded-t-xl">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll let you know when something important happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 ${
                      !notification.read ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead([notification.id])}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-xs text-primary hover:underline"
                              onClick={() => setOpen(false)}
                            >
                              {notification.action_label || "View"}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator className="bg-white/10" />
            <div className="p-2 bg-white/5 border-t border-white/10">
              <Button 
                variant="ghost" 
                className="w-full text-sm h-9"
                onClick={() => {
                  setOpen(false)
                  window.location.href = "/dashboard/notifications"
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
    </>
  )
}
