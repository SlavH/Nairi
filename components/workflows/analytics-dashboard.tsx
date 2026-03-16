/**
 * Nairi AI Workflow Builder - Analytics Dashboard
 * Visual dashboards showing workflow health and performance
 */

"use client"

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import { WorkflowExecution, ExecutionStatus } from '@/lib/workflows/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  AlertTriangle,
  Timer,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// ============================================================================
// Analytics Dashboard Component
// ============================================================================

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { currentWorkflow, executions } = useWorkflowStore()

  // Filter executions for current workflow
  const workflowExecutions = useMemo(() => {
    if (!currentWorkflow) return []
    return executions.filter(e => e.workflowId === currentWorkflow.id)
  }, [currentWorkflow, executions])

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = workflowExecutions.length
    const successful = workflowExecutions.filter(e => e.status === 'completed').length
    const failed = workflowExecutions.filter(e => e.status === 'failed').length
    const cancelled = workflowExecutions.filter(e => e.status === 'cancelled').length
    
    const durations = workflowExecutions
      .filter(e => e.duration)
      .map(e => e.duration!)
    
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
    
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
    
    const successRate = total > 0 ? (successful / total) * 100 : 0
    const failureRate = total > 0 ? (failed / total) * 100 : 0

    // Calculate trend (compare last 5 vs previous 5)
    const recent = workflowExecutions.slice(0, 5)
    const previous = workflowExecutions.slice(5, 10)
    const recentSuccessRate = recent.length > 0
      ? (recent.filter(e => e.status === 'completed').length / recent.length) * 100
      : 0
    const previousSuccessRate = previous.length > 0
      ? (previous.filter(e => e.status === 'completed').length / previous.length) * 100
      : 0
    const trend = recentSuccessRate - previousSuccessRate

    return {
      total,
      successful,
      failed,
      cancelled,
      avgDuration,
      minDuration,
      maxDuration,
      successRate,
      failureRate,
      trend,
    }
  }, [workflowExecutions])

  // Node performance
  const nodePerformance = useMemo(() => {
    const nodeStats: Record<string, {
      name: string
      executions: number
      avgDuration: number
      errorRate: number
    }> = {}

    workflowExecutions.forEach(execution => {
      execution.nodeResults.forEach(result => {
        if (!nodeStats[result.nodeId]) {
          nodeStats[result.nodeId] = {
            name: result.nodeName,
            executions: 0,
            avgDuration: 0,
            errorRate: 0,
          }
        }
        const stats = nodeStats[result.nodeId]
        stats.executions++
        if (result.duration) {
          stats.avgDuration = 
            (stats.avgDuration * (stats.executions - 1) + result.duration) / stats.executions
        }
        if (result.status === 'failed') {
          stats.errorRate = 
            ((stats.errorRate * (stats.executions - 1)) + 100) / stats.executions
        }
      })
    })

    return Object.entries(nodeStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.executions - a.executions)
  }, [workflowExecutions])

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (!currentWorkflow) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No workflow selected</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Analytics</h2>
            <p className="text-sm text-muted-foreground">{currentWorkflow.name}</p>
          </div>
          <Badge variant="outline">
            {metrics.total} executions
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Success Rate"
            value={`${metrics.successRate.toFixed(1)}%`}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            trend={metrics.trend}
            trendLabel="vs previous"
          />
          <MetricCard
            title="Avg Duration"
            value={formatDuration(metrics.avgDuration)}
            icon={<Timer className="h-4 w-4 text-blue-500" />}
            subtitle={`${formatDuration(metrics.minDuration)} - ${formatDuration(metrics.maxDuration)}`}
          />
          <MetricCard
            title="Successful"
            value={metrics.successful.toString()}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            subtitle={`of ${metrics.total} total`}
          />
          <MetricCard
            title="Failed"
            value={metrics.failed.toString()}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            subtitle={`${metrics.failureRate.toFixed(1)}% failure rate`}
          />
        </div>

        {/* Execution Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {workflowExecutions.slice(0, 20).map((execution, i) => (
                <div
                  key={execution.id}
                  className={cn(
                    'flex-1 h-8 rounded-sm transition-colors',
                    execution.status === 'completed' && 'bg-green-500',
                    execution.status === 'failed' && 'bg-red-500',
                    execution.status === 'cancelled' && 'bg-orange-500',
                    execution.status === 'running' && 'bg-blue-500 animate-pulse',
                    !['completed', 'failed', 'cancelled', 'running'].includes(execution.status) && 'bg-gray-300'
                  )}
                  title={`${execution.status} - ${formatDuration(execution.duration || 0)}`}
                />
              ))}
              {workflowExecutions.length === 0 && (
                <div className="flex-1 h-8 rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  No executions yet
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Newest</span>
              <span>Oldest</span>
            </div>
          </CardContent>
        </Card>

        {/* Node Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Node Performance</CardTitle>
            <CardDescription>Average execution time per node</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nodePerformance.slice(0, 5).map((node) => (
                <div key={node.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{node.name}</span>
                    <span className="text-muted-foreground">
                      {formatDuration(node.avgDuration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            (node.avgDuration / (metrics.maxDuration || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    {node.errorRate > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {node.errorRate.toFixed(0)}% errors
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {nodePerformance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No node data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <StatusBar
                label="Completed"
                count={metrics.successful}
                total={metrics.total}
                color="bg-green-500"
              />
              <StatusBar
                label="Failed"
                count={metrics.failed}
                total={metrics.total}
                color="bg-red-500"
              />
              <StatusBar
                label="Cancelled"
                count={metrics.cancelled}
                total={metrics.total}
                color="bg-orange-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  subtitle?: string
}

function MetricCard({ title, value, icon, trend, trendLabel, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trend > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            <span>{Math.abs(trend).toFixed(1)}% {trendLabel}</span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Status Bar Component
// ============================================================================

interface StatusBarProps {
  label: string
  count: number
  total: number
  color: string
}

function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
