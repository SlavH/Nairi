/**
 * Nairi AI Workflow Builder - Node Components
 * Visual node components for the workflow canvas
 */

"use client"

import React, { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Webhook,
  Clock,
  Play,
  Zap,
  RefreshCw,
  Globe,
  Code,
  Shuffle,
  Mail,
  Database,
  File,
  Sparkles,
  GitBranch,
  GitMerge,
  Route,
  Repeat,
  RotateCw,
  GitFork,
  Merge,
  Timer,
  AlertTriangle,
  RefreshCcw,
  Shield,
  Download,
  Upload,
  Variable,
  Plug,
  Send,
  MessageSquare,
  Workflow,
  Box,
  GripVertical,
  Trash2,
  Copy,
  Settings,
  MoreHorizontal,
  ChevronRight,
  Circle,
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
} from 'lucide-react'
import { WorkflowNode, NodeType, ExecutionStatus } from '@/lib/workflows/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ============================================================================
// Node Icon Mapping
// ============================================================================

export const NODE_ICONS: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  'trigger-webhook': Webhook,
  'trigger-schedule': Clock,
  'trigger-manual': Play,
  'trigger-event': Zap,
  'trigger-polling': RefreshCw,
  'action-http': Globe,
  'action-code': Code,
  'action-transform': Shuffle,
  'action-email': Mail,
  'action-database': Database,
  'action-file': File,
  'action-ai': Sparkles,
  'condition-if': GitBranch,
  'condition-switch': GitMerge,
  'condition-router': Route,
  'loop-foreach': Repeat,
  'loop-while': RotateCw,
  'parallel-branch': GitFork,
  'merge': Merge,
  'delay': Timer,
  'error-handler': AlertTriangle,
  'retry': RefreshCcw,
  'fallback': Shield,
  'data-store-get': Download,
  'data-store-set': Upload,
  'variable-set': Variable,
  'variable-get': Variable,
  'integration-api': Plug,
  'integration-webhook-out': Send,
  'comment': MessageSquare,
  'subworkflow': Workflow,
}

// ============================================================================
// Node Colors
// ============================================================================

export const NODE_COLORS: Record<string, string> = {
  'triggers': 'bg-green-500/20 border-green-500 text-green-500',
  'actions': 'bg-blue-500/20 border-blue-500 text-blue-500',
  'control-flow': 'bg-amber-500/20 border-amber-500 text-amber-500',
  'data': 'bg-violet-500/20 border-violet-500 text-violet-500',
  'integrations': 'bg-pink-500/20 border-pink-500 text-pink-500',
  'error-handling': 'bg-red-500/20 border-red-500 text-red-500',
  'utility': 'bg-gray-500/20 border-gray-500 text-gray-500',
}

export const NODE_HEADER_COLORS: Record<string, string> = {
  'triggers': 'bg-green-500',
  'actions': 'bg-blue-500',
  'control-flow': 'bg-amber-500',
  'data': 'bg-violet-500',
  'integrations': 'bg-pink-500',
  'error-handling': 'bg-red-500',
  'utility': 'bg-gray-500',
}

// ============================================================================
// Execution Status Icons
// ============================================================================

const ExecutionStatusIcon = ({ status }: { status?: ExecutionStatus }) => {
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
      return null
  }
}

// ============================================================================
// Port Component
// ============================================================================

interface PortProps {
  id: string
  name: string
  type: 'input' | 'output'
  isConnected?: boolean
  isConnecting?: boolean
  onStartConnection?: () => void
  onEndConnection?: () => void
}

export const Port = memo(function Port({
  id,
  name,
  type,
  isConnected,
  isConnecting,
  onStartConnection,
  onEndConnection,
}: PortProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        type === 'input' ? "flex-row" : "flex-row-reverse"
      )}
    >
      <button
        className={cn(
          "h-3 w-3 rounded-full border-2 transition-all",
          "hover:scale-125 hover:shadow-lg",
          isConnected
            ? "bg-violet-500 border-violet-500"
            : "bg-background border-muted-foreground/50",
          isConnecting && "ring-2 ring-violet-500 ring-offset-2"
        )}
        onMouseDown={(e) => {
          e.stopPropagation()
          if (type === 'output') onStartConnection?.()
        }}
        onMouseUp={(e) => {
          e.stopPropagation()
          if (type === 'input') onEndConnection?.()
        }}
      />
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  )
})

// ============================================================================
// Base Node Component
// ============================================================================

interface WorkflowNodeComponentProps {
  node: WorkflowNode
  isSelected?: boolean
  isHovered?: boolean
  executionStatus?: ExecutionStatus
  onSelect?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onConfigure?: () => void
  onStartConnection?: (portId: string) => void
  onEndConnection?: (portId: string) => void
  connectedPorts?: Set<string>
  isConnecting?: boolean
  style?: React.CSSProperties
}

export const WorkflowNodeComponent = memo(function WorkflowNodeComponent({
  node,
  isSelected,
  isHovered,
  executionStatus,
  onSelect,
  onDelete,
  onDuplicate,
  onConfigure,
  onStartConnection,
  onEndConnection,
  connectedPorts = new Set(),
  isConnecting,
  style,
}: WorkflowNodeComponentProps) {
  const category = node.metadata?.category || 'utility'
  const Icon = NODE_ICONS[node.type] || Box
  const headerColor = NODE_HEADER_COLORS[category]

  return (
    <div
      className={cn(
        "absolute rounded-lg border-2 bg-background shadow-lg transition-all min-w-[200px]",
        isSelected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-background",
        isHovered && !isSelected && "ring-1 ring-muted-foreground/50",
        node.isDisabled && "opacity-50"
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between rounded-t-md px-3 py-2", headerColor)}>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab text-white/70" />
          <Icon className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">{node.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <ExecutionStatusIcon status={executionStatus} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Description */}
        {node.description && (
          <p className="text-xs text-muted-foreground mb-3">{node.description}</p>
        )}

        {/* Ports */}
        <div className="flex justify-between">
          {/* Input Ports */}
          <div className="space-y-2">
            {node.inputs.map((port) => (
              <Port
                key={port.id}
                id={port.id}
                name={port.name}
                type="input"
                isConnected={connectedPorts.has(`input-${port.id}`)}
                isConnecting={isConnecting}
                onEndConnection={() => onEndConnection?.(port.id)}
              />
            ))}
          </div>

          {/* Output Ports */}
          <div className="space-y-2">
            {node.outputs.map((port) => (
              <Port
                key={port.id}
                id={port.id}
                name={port.name}
                type="output"
                isConnected={connectedPorts.has(`output-${port.id}`)}
                isConnecting={isConnecting}
                onStartConnection={() => onStartConnection?.(port.id)}
              />
            ))}
          </div>
        </div>

        {/* Breakpoint indicator */}
        {node.isBreakpoint && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-red-500 border-2 border-background" />
          </div>
        )}
      </div>

      {/* Status badges */}
      {node.isDisabled && (
        <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
          Disabled
        </Badge>
      )}
    </div>
  )
})

// ============================================================================
// Mini Node (for palette/library)
// ============================================================================

interface MiniNodeProps {
  type: NodeType
  name: string
  category: string
  description?: string
  onDragStart?: (e: React.DragEvent) => void
  onClick?: () => void
}

export const MiniNode = memo(function MiniNode({
  type,
  name,
  category,
  description,
  onDragStart,
  onClick,
}: MiniNodeProps) {
  const Icon = NODE_ICONS[type] || Box
  const colorClass = NODE_COLORS[category] || NODE_COLORS['utility']

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-grab transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        colorClass
      )}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className={cn("p-2 rounded-md", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// Node Definitions for Palette
// ============================================================================

export const NODE_DEFINITIONS = [
  // Triggers
  { type: 'trigger-webhook' as NodeType, name: 'Webhook', category: 'triggers', description: 'Receive HTTP requests' },
  { type: 'trigger-schedule' as NodeType, name: 'Schedule', category: 'triggers', description: 'Run on a schedule' },
  { type: 'trigger-manual' as NodeType, name: 'Manual', category: 'triggers', description: 'Start manually' },
  { type: 'trigger-event' as NodeType, name: 'Event', category: 'triggers', description: 'Listen for events' },
  { type: 'trigger-polling' as NodeType, name: 'Polling', category: 'triggers', description: 'Poll an endpoint' },
  
  // Actions
  { type: 'action-http' as NodeType, name: 'HTTP Request', category: 'actions', description: 'Make HTTP calls' },
  { type: 'action-code' as NodeType, name: 'Code', category: 'actions', description: 'Run custom code' },
  { type: 'action-transform' as NodeType, name: 'Transform', category: 'actions', description: 'Transform data' },
  { type: 'action-email' as NodeType, name: 'Email', category: 'actions', description: 'Send emails' },
  { type: 'action-database' as NodeType, name: 'Database', category: 'actions', description: 'Database operations' },
  { type: 'action-ai' as NodeType, name: 'AI', category: 'actions', description: 'AI/ML operations' },
  
  // Control Flow
  { type: 'condition-if' as NodeType, name: 'If/Else', category: 'control-flow', description: 'Conditional branching' },
  { type: 'condition-switch' as NodeType, name: 'Switch', category: 'control-flow', description: 'Multi-way branching' },
  { type: 'condition-router' as NodeType, name: 'Router', category: 'control-flow', description: 'Route by rules' },
  { type: 'loop-foreach' as NodeType, name: 'For Each', category: 'control-flow', description: 'Loop over items' },
  { type: 'loop-while' as NodeType, name: 'While', category: 'control-flow', description: 'Loop while condition' },
  { type: 'parallel-branch' as NodeType, name: 'Parallel', category: 'control-flow', description: 'Run in parallel' },
  { type: 'merge' as NodeType, name: 'Merge', category: 'control-flow', description: 'Merge branches' },
  { type: 'delay' as NodeType, name: 'Delay', category: 'control-flow', description: 'Wait for time' },
  
  // Data
  { type: 'data-store-get' as NodeType, name: 'Get Data', category: 'data', description: 'Read from store' },
  { type: 'data-store-set' as NodeType, name: 'Set Data', category: 'data', description: 'Write to store' },
  { type: 'variable-set' as NodeType, name: 'Set Variable', category: 'data', description: 'Set a variable' },
  { type: 'variable-get' as NodeType, name: 'Get Variable', category: 'data', description: 'Get a variable' },
  
  // Error Handling
  { type: 'error-handler' as NodeType, name: 'Error Handler', category: 'error-handling', description: 'Handle errors' },
  { type: 'retry' as NodeType, name: 'Retry', category: 'error-handling', description: 'Retry on failure' },
  { type: 'fallback' as NodeType, name: 'Fallback', category: 'error-handling', description: 'Fallback value' },
  
  // Integrations
  { type: 'integration-api' as NodeType, name: 'API', category: 'integrations', description: 'External API' },
  { type: 'integration-webhook-out' as NodeType, name: 'Webhook Out', category: 'integrations', description: 'Send webhook' },
  
  // Utility
  { type: 'comment' as NodeType, name: 'Comment', category: 'utility', description: 'Add a note' },
  { type: 'subworkflow' as NodeType, name: 'Subworkflow', category: 'utility', description: 'Run another workflow' },
]

export const getNodesByCategory = (category: string) => {
  return NODE_DEFINITIONS.filter(n => n.category === category)
}

export const getAllCategories = () => {
  return [...new Set(NODE_DEFINITIONS.map(n => n.category))]
}
