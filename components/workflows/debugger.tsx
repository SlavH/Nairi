/**
 * Nairi AI Workflow Builder - Interactive Debugger
 * Step-through debugging and simulated test data
 */

"use client"

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import { WorkflowNode, ExecutionStatus } from '@/lib/workflows/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Bug,
  Play,
  Pause,
  SkipForward,
  StepForward,
  Square,
  RotateCcw,
  Circle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Variable,
  Database,
  Terminal,
} from 'lucide-react'

// ============================================================================
// Debugger Component
// ============================================================================

interface DebuggerProps {
  className?: string
}

export function Debugger({ className }: DebuggerProps) {
  const {
    currentWorkflow,
    currentExecution,
    isExecuting,
    isDebugMode,
    toggleDebugMode,
  } = useWorkflowStore()

  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set())
  const [watchedVariables, setWatchedVariables] = useState<string[]>(['input', 'output'])
  const [testData, setTestData] = useState<string>('{}')
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [stepMode, setStepMode] = useState<'step' | 'run'>('run')

  // Toggle breakpoint
  const toggleBreakpoint = useCallback((nodeId: string) => {
    setBreakpoints(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // Add watched variable
  const addWatchedVariable = useCallback((name: string) => {
    if (name && !watchedVariables.includes(name)) {
      setWatchedVariables(prev => [...prev, name])
    }
  }, [watchedVariables])

  // Remove watched variable
  const removeWatchedVariable = useCallback((name: string) => {
    setWatchedVariables(prev => prev.filter(v => v !== name))
  }, [])

  // Get node status
  const getNodeStatus = (nodeId: string): ExecutionStatus | undefined => {
    return currentExecution?.nodeResults.find(r => r.nodeId === nodeId)?.status
  }

  // Get node output
  const getNodeOutput = (nodeId: string): any => {
    return currentExecution?.nodeResults.find(r => r.nodeId === nodeId)?.output
  }

  if (!currentWorkflow) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <Bug className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No workflow selected</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          <h2 className="font-semibold">Debugger</h2>
          <Badge variant={isDebugMode ? 'default' : 'secondary'}>
            {isDebugMode ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <Switch checked={isDebugMode} onCheckedChange={toggleDebugMode} />
      </div>

      {/* Content */}
      <Tabs defaultValue="breakpoints" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="breakpoints" className="text-xs gap-1">
            <Circle className="h-3 w-3" />
            Breakpoints
          </TabsTrigger>
          <TabsTrigger value="watch" className="text-xs gap-1">
            <Eye className="h-3 w-3" />
            Watch
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs gap-1">
            <Terminal className="h-3 w-3" />
            Test Data
          </TabsTrigger>
        </TabsList>

        {/* Breakpoints Tab */}
        <TabsContent value="breakpoints" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {currentWorkflow.nodes.map((node) => (
                <div
                  key={node.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    breakpoints.has(node.id) && 'border-red-500 bg-red-500/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      className={cn(
                        'h-4 w-4 rounded-full border-2 transition-colors',
                        breakpoints.has(node.id)
                          ? 'bg-red-500 border-red-500'
                          : 'border-muted-foreground/50 hover:border-red-500'
                      )}
                      onClick={() => toggleBreakpoint(node.id)}
                    />
                    <div>
                      <p className="text-sm font-medium">{node.name}</p>
                      <p className="text-xs text-muted-foreground">{node.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NodeStatusIcon status={getNodeStatus(node.id)} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Watch Tab */}
        <TabsContent value="watch" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Add Variable */}
              <div className="flex gap-2">
                <Input
                  placeholder="Variable name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addWatchedVariable((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Watched Variables */}
              <div className="space-y-2">
                {watchedVariables.map((name) => (
                  <Card key={name}>
                    <CardHeader className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Variable className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeWatchedVariable(name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                        {JSON.stringify(
                          currentExecution?.variables?.[name] ?? 'undefined',
                          null,
                          2
                        )}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Node Outputs */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Node Outputs</h3>
                {currentWorkflow.nodes.map((node) => {
                  const output = getNodeOutput(node.id)
                  if (!output) return null
                  return (
                    <Card key={node.id}>
                      <CardHeader className="py-2 px-3">
                        <span className="text-sm font-medium">{node.name}</span>
                      </CardHeader>
                      <CardContent className="py-2 px-3">
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                          {JSON.stringify(output, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Test Data Tab */}
        <TabsContent value="test" className="flex-1 m-0">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Test Input Data (JSON)</Label>
              <Textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder='{"key": "value"}'
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Load Sample
              </Button>
              <Button className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Run with Test Data
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debug Controls */}
      {isDebugMode && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Debug Controls</span>
            <Badge variant="outline">
              {isPaused ? 'Paused' : isExecuting ? 'Running' : 'Idle'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isExecuting}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isPaused}
            >
              <StepForward className="h-4 w-4 mr-1" />
              Step
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!isPaused}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isExecuting}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Node Status Icon
// ============================================================================

function NodeStatusIcon({ status }: { status?: ExecutionStatus }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'paused':
      return <Pause className="h-4 w-4 text-amber-500" />
    case 'waiting':
      return <Clock className="h-4 w-4 text-gray-500" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/30" />
  }
}
