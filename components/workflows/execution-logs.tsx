/**
 * Nairi AI Workflow Builder - Execution Logs
 * Real-time monitoring and logging component
 */

"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import { WorkflowExecution, ExecutionLog, ExecutionNodeResult, ExecutionStatus } from '@/lib/workflows/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileText,
  Activity,
  Zap,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// ============================================================================
// Status Badge Component
// ============================================================================

const StatusBadge = ({ status }: { status: ExecutionStatus }) => {
  const config: Record<ExecutionStatus, { icon: React.ReactNode; className: string; label: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, className: 'bg-gray-500/20 text-gray-500', label: 'Pending' },
    running: { icon: <Loader2 className="h-3 w-3 animate-spin" />, className: 'bg-blue-500/20 text-blue-500', label: 'Running' },
    completed: { icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-green-500/20 text-green-500', label: 'Completed' },
    failed: { icon: <XCircle className="h-3 w-3" />, className: 'bg-red-500/20 text-red-500', label: 'Failed' },
    cancelled: { icon: <Square className="h-3 w-3" />, className: 'bg-orange-500/20 text-orange-500', label: 'Cancelled' },
    paused: { icon: <Pause className="h-3 w-3" />, className: 'bg-amber-500/20 text-amber-500', label: 'Paused' },
    waiting: { icon: <Clock className="h-3 w-3" />, className: 'bg-purple-500/20 text-purple-500', label: 'Waiting' },
  }

  const { icon, className, label } = config[status]

  return (
    <Badge variant="secondary" className={cn('gap-1', className)}>
      {icon}
      {label}
    </Badge>
  )
}

// ============================================================================
// Log Level Badge
// ============================================================================

const LogLevelBadge = ({ level }: { level: ExecutionLog['level'] }) => {
  const config: Record<ExecutionLog['level'], { className: string }> = {
    debug: { className: 'bg-gray-500/20 text-gray-500' },
    info: { className: 'bg-blue-500/20 text-blue-500' },
    warn: { className: 'bg-amber-500/20 text-amber-500' },
    error: { className: 'bg-red-500/20 text-red-500' },
  }

  return (
    <Badge variant="secondary" className={cn('text-[10px] uppercase', config[level].className)}>
      {level}
    </Badge>
  )
}

// ============================================================================
// Execution Logs Component
// ============================================================================

interface ExecutionLogsProps {
  className?: string
}

export function ExecutionLogs({ className }: ExecutionLogsProps) {
  const { executions, currentExecution, clearExecutions, stopExecution } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Get the execution to display
  const displayExecution = selectedExecution
    ? executions.find(e => e.id === selectedExecution)
    : currentExecution

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!displayExecution) return []
    
    return displayExecution.logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          log.message.toLowerCase().includes(query) ||
          log.nodeId?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [displayExecution, levelFilter, searchQuery])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  // Export logs
  const exportLogs = () => {
    if (!displayExecution) return
    const data = JSON.stringify(displayExecution, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-${displayExecution.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs defaultValue="logs" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <TabsList className="bg-transparent">
            <TabsTrigger value="logs" className="text-xs gap-1">
              <Terminal className="h-3 w-3" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="nodes" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              Nodes
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {displayExecution?.status === 'running' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => displayExecution && stopExecution(displayExecution.id)}
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearExecutions}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="logs" className="flex-1 flex flex-col m-0">
          {/* Filters */}
          <div className="flex items-center gap-2 p-2 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={autoScroll ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              <RefreshCw className={cn('h-4 w-4', autoScroll && 'animate-spin')} />
            </Button>
          </div>

          {/* Execution Info */}
          {displayExecution && (
            <div className="flex items-center justify-between p-2 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <StatusBadge status={displayExecution.status} />
                <span className="text-xs text-muted-foreground">
                  {displayExecution.triggeredBy}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(displayExecution.startTime)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Duration: {formatDuration(displayExecution.duration)}</span>
                <span>Logs: {displayExecution.logs.length}</span>
              </div>
            </div>
          )}

          {/* Log List */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-2 space-y-1 font-mono text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded hover:bg-muted/50',
                      log.level === 'error' && 'bg-red-500/5',
                      log.level === 'warn' && 'bg-amber-500/5'
                    )}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <LogLevelBadge level={log.level} />
                    {log.nodeId && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {log.nodeId.slice(0, 8)}
                      </Badge>
                    )}
                    <span className="flex-1 break-all">{log.message}</span>
                    {log.data && (
                      <code className="text-[10px] text-muted-foreground">
                        {JSON.stringify(log.data).slice(0, 50)}
                      </code>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Terminal className="h-8 w-8 mb-2 opacity-50" />
                  <p>No logs to display</p>
                  <p className="text-xs">Run a workflow to see execution logs</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="nodes" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {displayExecution?.nodeResults.map((result) => (
                <NodeResultCard key={result.nodeId} result={result} />
              ))}
              {(!displayExecution || displayExecution.nodeResults.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-50" />
                  <p>No node results</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {executions.map((execution) => (
                <button
                  key={execution.id}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                    selectedExecution === execution.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedExecution(execution.id)}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={execution.status} />
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {new Date(execution.startTime).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {execution.triggeredBy} • {formatDuration(execution.duration)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {executions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p>No execution history</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// Node Result Card
// ============================================================================

function NodeResultCard({ result }: { result: ExecutionNodeResult }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <StatusBadge status={result.status} />
            <div className="text-left">
              <p className="text-sm font-medium">{result.nodeName}</p>
              <p className="text-xs text-muted-foreground">{result.nodeType}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {formatDuration(result.duration)}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border border-t-0 rounded-b-lg space-y-3">
          {result.input && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.input, null, 2)}
              </pre>
            </div>
          )}
          {result.output && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
          {result.error && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1">Error</p>
              <pre className="text-xs bg-red-500/10 text-red-500 p-2 rounded overflow-auto max-h-32">
                {result.error.message}
                {result.error.stack && `\n\n${result.error.stack}`}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
