"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  Shield, 
  MessageSquare, 
  Store, 
  Settings, 
  Lock,
  User,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Filter,
  RefreshCw
} from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const categoryIcons: Record<string, typeof Activity> = {
  auth: Lock,
  creation: Activity,
  chat: MessageSquare,
  marketplace: Store,
  settings: Settings,
  security: Shield
}

const categoryColors: Record<string, string> = {
  auth: "bg-blue-500/10 text-blue-500",
  creation: "bg-purple-500/10 text-purple-500",
  chat: "bg-green-500/10 text-green-500",
  marketplace: "bg-orange-500/10 text-orange-500",
  settings: "bg-slate-500/10 text-slate-400",
  security: "bg-red-500/10 text-red-500"
}

const riskColors: Record<string, { bg: string; text: string; icon: typeof Info }> = {
  low: { bg: "bg-green-500/10", text: "text-green-500", icon: CheckCircle },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-500", icon: Info },
  high: { bg: "bg-orange-500/10", text: "text-orange-500", icon: AlertTriangle },
  critical: { bg: "bg-red-500/10", text: "text-red-500", icon: AlertTriangle }
}

interface ActivityLog {
  id: string
  action: string
  category: string
  description: string | null
  metadata: Record<string, any>
  risk_level: string
  created_at: string
}

export default function ActivityPage() {
  const [category, setCategory] = useState<string>("all")
  
  const { data, error, isLoading, mutate } = useSWR<{
    logs: ActivityLog[]
    stats: { weeklyTotal: number; byCategory: Record<string, number> }
  }>(
    category === "all" ? "/api/activity" : `/api/activity?category=${category}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity & Security</h1>
          <p className="text-muted-foreground mt-1">Monitor your account activity and security events</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => mutate()}
          className="bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.stats?.weeklyTotal || 0}</p>
                <p className="text-xs text-muted-foreground">Events this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {["auth", "chat", "creation"].map((cat) => {
          const Icon = categoryIcons[cat]
          return (
            <Card key={cat} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[cat]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{data?.stats?.byCategory?.[cat] || 0}</p>
                    <p className="text-xs text-muted-foreground capitalize">{cat} events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Log */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Activity Log</CardTitle>
              <CardDescription>Real-time view of your account activity</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="creation">Creations</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive/50" />
              <p className="text-muted-foreground mt-4">Failed to load activity logs</p>
            </div>
          ) : !data?.logs || data?.logs?.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">No activity recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your activity will appear here as you use Nairi</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {data?.logs.map((log) => {
                  const Icon = categoryIcons[log.category] || Activity
                  const risk = riskColors[log.risk_level] || riskColors.low
                  const RiskIcon = risk.icon

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[log.category]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{log.action}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {log.category}
                          </Badge>
                          {log.risk_level !== "low" && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${risk.bg} ${risk.text}`}>
                              <RiskIcon className="h-3 w-3" />
                              {log.risk_level}
                            </div>
                          )}
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                {key}: {String(value).slice(0, 20)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatTime(log.created_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Security Features Info */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#22d3ee]" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-medium text-foreground">Isolated Execution</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All AI operations run in sandboxed environments for maximum security.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-medium text-foreground">Real-time Monitoring</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Every action is logged and monitored for suspicious activity.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-medium text-foreground">Critical Confirmations</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Important operations require explicit user approval before execution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
