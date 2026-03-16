"use client"

import { useState } from "react"
import { 
  Bell, Check, CheckCheck, Trash2, Filter, 
  Zap, Gift, Shield, AlertTriangle, Info, Sparkles,
  Search, Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSWR from "swr"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"

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
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  success: "bg-green-500/10 text-green-500 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  system: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  achievement: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  referral: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  credits: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
}

const typeLabels: Record<string, string> = {
  info: "Information",
  success: "Success",
  warning: "Warning",
  error: "Error",
  system: "System",
  achievement: "Achievement",
  referral: "Referral",
  credits: "Credits"
}

export default function NotificationsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("notifications")
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [achievementAlerts, setAchievementAlerts] = useState(true)
  const [creditsAlerts, setCreditsAlerts] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(true)
  const [marketplaceAlerts, setMarketplaceAlerts] = useState(true)
  
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    "/api/notifications?limit=100",
    fetcher
  )

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids })
      })
      mutate()
      toast.success("Notification marked as read")
    } catch (error) {
      toast.error("Failed to mark notification as read")
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
    } catch (error) {
      toast.error("Failed to mark all as read")
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
      toast.success("Notification deleted")
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  }

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0
  
  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = searchQuery === "" || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "all" || n.type === typeFilter
    
    const matchesTab = activeTab === "notifications" || 
      (activeTab === "unread" && !n.read) ||
      (activeTab === "read" && n.read)
    
    return matchesSearch && matchesType && matchesTab
  })

  const saveSettings = () => {
    toast.success("Notification settings saved")
  }

  const renderNotificationList = () => {
    return (
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No notifications found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "We'll let you know when something important happens"
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell
            
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.read 
                    ? "bg-white/10 backdrop-blur-sm border-white/20" 
                    : "bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${typeColors[notification.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[notification.type]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              {notification.action_label || "View details"}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => markAsRead([notification.id])}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : "You're all caught up!"
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="gap-2 bg-transparent">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="bg-white/5 backdrop-blur-md border-white/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/10 border-white/20"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-white/10 border border-white/20 backdrop-blur-sm">
              <TabsTrigger value="notifications">
                All
                <Badge variant="secondary" className="ml-2 text-xs">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 text-xs bg-[#e879f9] text-white">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Channels</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg">Notification Types</CardTitle>
                  <CardDescription>Select which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor="achievement-alerts">Achievements</Label>
                        <p className="text-sm text-muted-foreground">Badges and milestones</p>
                      </div>
                    </div>
                    <Switch
                      id="achievement-alerts"
                      checked={achievementAlerts}
                      onCheckedChange={setAchievementAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-500">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor="credits-alerts">Credits & Rewards</Label>
                        <p className="text-sm text-muted-foreground">Credit earnings and bonuses</p>
                      </div>
                    </div>
                    <Switch
                      id="credits-alerts"
                      checked={creditsAlerts}
                      onCheckedChange={setCreditsAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-500/10 text-slate-400">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor="system-alerts">System Updates</Label>
                        <p className="text-sm text-muted-foreground">Platform announcements</p>
                      </div>
                    </div>
                    <Switch
                      id="system-alerts"
                      checked={systemAlerts}
                      onCheckedChange={setSystemAlerts}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-500/10 text-pink-500">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor="marketplace-alerts">Marketplace</Label>
                        <p className="text-sm text-muted-foreground">Sales, purchases, and updates</p>
                      </div>
                    </div>
                    <Switch
                      id="marketplace-alerts"
                      checked={marketplaceAlerts}
                      onCheckedChange={setMarketplaceAlerts}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={saveSettings}
                  className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                >
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-2">
              {renderNotificationList()}
            </TabsContent>

            <TabsContent value="unread" className="space-y-2">
              {renderNotificationList()}
            </TabsContent>

            <TabsContent value="read" className="space-y-2">
              {renderNotificationList()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
