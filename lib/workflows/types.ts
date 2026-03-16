/**
 * Nairi AI Workflow Builder - Core Types
 * Comprehensive type definitions for the workflow system
 */

// ============================================================================
// Node Types
// ============================================================================

export type NodeType =
  // Triggers
  | "trigger-webhook"
  | "trigger-schedule"
  | "trigger-manual"
  | "trigger-event"
  | "trigger-polling"
  // Actions
  | "action-http"
  | "action-code"
  | "action-transform"
  | "action-email"
  | "action-database"
  | "action-file"
  | "action-ai"
  // Control Flow
  | "condition-if"
  | "condition-switch"
  | "condition-router"
  | "loop-foreach"
  | "loop-while"
  | "parallel-branch"
  | "merge"
  | "delay"
  // Error Handling
  | "error-handler"
  | "retry"
  | "fallback"
  // Data
  | "data-store-get"
  | "data-store-set"
  | "variable-set"
  | "variable-get"
  // Integration
  | "integration-api"
  | "integration-webhook-out"
  // Utility
  | "comment"
  | "subworkflow"

export type NodeCategory =
  | "triggers"
  | "actions"
  | "control-flow"
  | "data"
  | "integrations"
  | "error-handling"
  | "utility"

// ============================================================================
// Node Definition
// ============================================================================

export interface NodePosition {
  x: number
  y: number
}

export interface NodePort {
  id: string
  name: string
  type: "input" | "output"
  dataType?: string
  required?: boolean
  multiple?: boolean
}

export interface NodeConfig {
  [key: string]: any
}

export interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  description?: string
  position: NodePosition
  config: NodeConfig
  inputs: NodePort[]
  outputs: NodePort[]
  isDisabled?: boolean
  isBreakpoint?: boolean
  metadata?: {
    color?: string
    icon?: string
    category?: NodeCategory
    version?: string
  }
}

// ============================================================================
// Connections/Edges
// ============================================================================

export interface WorkflowEdge {
  id: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
  label?: string
  condition?: string
  isAnimated?: boolean
  metadata?: {
    color?: string
    style?: "solid" | "dashed" | "dotted"
  }
}

// ============================================================================
// Workflow Definition
// ============================================================================

export type WorkflowStatus = "draft" | "active" | "paused" | "archived" | "error"

export interface WorkflowVariable {
  id: string
  name: string
  type: "string" | "number" | "boolean" | "object" | "array"
  defaultValue?: any
  description?: string
  isSecret?: boolean
}

export interface WorkflowSettings {
  timeout?: number // in milliseconds
  retryCount?: number
  retryDelay?: number
  concurrencyLimit?: number
  errorHandling?: "stop" | "continue" | "retry"
  logging?: "minimal" | "normal" | "verbose"
  sandbox?: boolean
}

export interface Workflow {
  id: string
  name: string
  description?: string
  version: string
  status: WorkflowStatus
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: WorkflowVariable[]
  settings: WorkflowSettings
  triggers: string[] // Node IDs of trigger nodes
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  tags?: string[]
  folderId?: string
  isTemplate?: boolean
  templateCategory?: string
}

// ============================================================================
// Execution Types
// ============================================================================

export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused"
  | "waiting"

export interface ExecutionNodeResult {
  nodeId: string
  nodeName: string
  nodeType: NodeType
  status: ExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number
  input?: any
  output?: any
  error?: {
    message: string
    stack?: string
    code?: string
  }
  retryCount?: number
  logs?: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: Date
  level: "debug" | "info" | "warn" | "error"
  message: string
  data?: any
  nodeId?: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  workflowVersion: string
  status: ExecutionStatus
  triggeredBy: "manual" | "webhook" | "schedule" | "event" | "api"
  triggerData?: any
  startTime: Date
  endTime?: Date
  duration?: number
  nodeResults: ExecutionNodeResult[]
  logs: ExecutionLog[]
  variables: Record<string, any>
  error?: {
    message: string
    nodeId?: string
    stack?: string
  }
  metadata?: {
    userId?: string
    ip?: string
    userAgent?: string
  }
}

// ============================================================================
// Template Types
// ============================================================================

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail?: string
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "createdBy">
  popularity?: number
  author?: string
  isOfficial?: boolean
}

// ============================================================================
// Data Store Types
// ============================================================================

export interface DataStoreEntry {
  key: string
  value: any
  type: string
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  workflowId?: string
  executionId?: string
}

export interface DataStore {
  id: string
  name: string
  description?: string
  entries: Record<string, DataStoreEntry>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// ============================================================================
// Version Control Types
// ============================================================================

export interface WorkflowVersion {
  id: string
  workflowId: string
  version: string
  snapshot: Workflow
  changes: string
  createdAt: Date
  createdBy?: string
  isPublished?: boolean
}

// ============================================================================
// Scheduling Types
// ============================================================================

export interface ScheduleConfig {
  type: "cron" | "interval" | "once"
  cron?: string
  interval?: number // in milliseconds
  runAt?: Date
  timezone?: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookConfig {
  id: string
  workflowId: string
  nodeId: string
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  headers?: Record<string, string>
  authentication?: {
    type: "none" | "basic" | "bearer" | "api-key"
    config?: Record<string, string>
  }
  responseConfig?: {
    statusCode: number
    headers?: Record<string, string>
    body?: any
  }
  isActive: boolean
  createdAt: Date
}

// ============================================================================
// Permission Types
// ============================================================================

export type PermissionLevel = "view" | "edit" | "execute" | "admin"

export interface WorkflowPermission {
  userId: string
  workflowId: string
  level: PermissionLevel
  grantedBy: string
  grantedAt: Date
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface WorkflowAnalytics {
  workflowId: string
  period: "hour" | "day" | "week" | "month"
  executions: {
    total: number
    successful: number
    failed: number
    cancelled: number
  }
  performance: {
    avgDuration: number
    minDuration: number
    maxDuration: number
    p95Duration: number
  }
  nodeMetrics: Record<string, {
    executions: number
    avgDuration: number
    errorRate: number
  }>
}

// ============================================================================
// Node Definition Registry
// ============================================================================

export interface NodeDefinition {
  type: NodeType
  name: string
  description: string
  category: NodeCategory
  icon: string
  color: string
  inputs: Omit<NodePort, "id">[]
  outputs: Omit<NodePort, "id">[]
  configSchema: {
    type: "object"
    properties: Record<string, {
      type: string
      title: string
      description?: string
      default?: any
      enum?: any[]
      required?: boolean
    }>
  }
  execute?: (context: ExecutionContext, config: NodeConfig) => Promise<any>
}

export interface ExecutionContext {
  workflowId: string
  executionId: string
  nodeId: string
  input: any
  variables: Record<string, any>
  dataStore: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any, ttl?: number) => Promise<void>
    delete: (key: string) => Promise<void>
  }
  log: (level: ExecutionLog["level"], message: string, data?: any) => void
  emit: (event: string, data: any) => void
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  NodeType as WorkflowNodeType,
  NodeCategory as WorkflowNodeCategory,
}
