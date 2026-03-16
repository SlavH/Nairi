"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  MessageSquare, 
  Sparkles, 
  Code, 
  Search,
  Wrench,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import useSWR from "swr"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const operationIcons: Record<string, typeof Activity> = {
  chat: MessageSquare,
  creation: Sparkles,
  analysis: BarChart3,
  code_generation: Code,
  search: Search,
  tool_call: Wrench
}

const operationColors: Record<string, string> = {
  chat: "bg-blue-500/10 text-blue-500",
  creation: "bg-purple-500/10 text-purple-500",
  analysis: "bg-indigo-500/10 text-indigo-500",
  code_generation: "bg-slate-500/10 text-slate-400",
  search: "bg-orange-500/10 text-orange-500",
  tool_call: "bg-cyan-500/10 text-cyan-500"
}

const statusColors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-500", icon: Clock },
  running: { bg: "bg-blue-500/10", text: "text-blue-500", icon: Loader2 },
  completed: { bg: "bg-green-500/10", text: "text-green-500", icon: CheckCircle },
  failed: { bg: "bg-red-500/10", text: "text-red-500", icon: XCircle },
  cancelled: { bg: "bg-slate-500/10", text: "text-slate-400", icon: XCircle }
}

interface ExecutionTrace {
  id: string
  operation_type: string
  status: string
  provider: string | null
  model: string | null
  input_summary: string | null
  output_summary: string | null
  tokens_input: number
  tokens_output: number
  credits_consumed: number
  duration_ms: number | null
  error_message: string | null
  trace_data: Record<string, any>
  started_at: string
  completed_at: string | null
  created_at: string
}

export default function TracesPage() {
  const [operationType, setOperationType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set())
  
  const queryParams = new URLSearchParams()
  if (operationType !== "all") queryParams.set("type", operationType)
  if (status !== "all") queryParams.set("status", status)
  
  const { data, error, isLoading, mutate } = useSWR<{
    traces: ExecutionTrace[]
    summary: {
      totalOperations: number
      totalTokensInput: number
      totalTokensOutput: number
      totalCredits: number
      totalDuration: number
      byType: Record<string, number>
      byStatus: Record<string, number>
    }
  }>(
    `/api/traces?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const toggleTrace = (id: string) => {
    const newExpanded = new Set(expandedTraces)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedTraces(newExpanded)
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Execution Traces</h1>
          <p className="text-muted-foreground mt-1">Monitor AI operations and track execution details</p>
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
                <p className="text-2xl font-bold text-foreground">{data?.summary.totalOperations || 0}</p>
                <p className="text-xs text-muted-foreground">Operations today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data?.summary.byStatus.completed || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {((data?.summary.totalTokensInput || 0) + (data?.summary.totalTokensOutput || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(data?.summary.totalDuration || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traces List */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Execution History</CardTitle>
              <CardDescription>Detailed view of AI operations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="creation">Creation</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="code_generation">Code</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="tool_call">Tool Call</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 mx-auto text-destructive/50" />
              <p className="text-muted-foreground mt-4">Failed to load traces</p>
            </div>
          ) : data?.traces.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">No execution traces yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI operations will be tracked here as you use Nairi
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {data?.traces.map((trace) => {
                  const Icon = operationIcons[trace.operation_type] || Activity
                  const statusInfo = statusColors[trace.status] || statusColors.pending
                  const StatusIcon = statusInfo.icon
                  const isExpanded = expandedTraces.has(trace.id)

                  return (
                    <Collapsible key={trace.id} open={isExpanded} onOpenChange={() => toggleTrace(trace.id)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${operationColors[trace.operation_type]}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground capitalize">
                                {trace.operation_type.replace("_", " ")}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {trace.provider || "Unknown"} / {trace.model || "N/A"}
                              </Badge>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusInfo.bg} ${statusInfo.text}`}>
                                <StatusIcon className={`h-3 w-3 ${trace.status === "running" ? "animate-spin" : ""}`} />
                                {trace.status}
                              </div>
                            </div>
                            {trace.input_summary && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {trace.input_summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                            <span>{formatDuration(trace.duration_ms)}</span>
                            <span>{formatTime(trace.started_at)}</span>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="ml-14 mt-2 p-4 rounded-lg bg-muted/30 border border-border space-y-3">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Input Tokens</p>
                              <p className="font-medium text-foreground">{trace.tokens_input.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Output Tokens</p>
                              <p className="font-medium text-foreground">{trace.tokens_output.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Credits Used</p>
                              <p className="font-medium text-foreground">{trace.credits_consumed}</p>
                            </div>
                          </div>
                          
                          {trace.output_summary && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Output Summary</p>
                              <p className="text-sm text-foreground">{trace.output_summary}</p>
                            </div>
                          )}
                          
                          {trace.error_message && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-500 font-medium mb-1">Error</p>
                              <p className="text-sm text-red-400">{trace.error_message}</p>
                            </div>
                          )}
                          
                          {trace.trace_data && Object.keys(trace.trace_data).length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Trace Data</p>
                              <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                                {JSON.stringify(trace.trace_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
