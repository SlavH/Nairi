/**
 * Nairi AI Workflow Builder - Utility Functions
 */

import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  NodeCategory,
  NodeDefinition,
  NodePort,
  ExecutionContext,
  NodeConfig
} from './types'

// ============================================================================
// ID Generation
// ============================================================================

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const generateShortId = (): string => {
  return Math.random().toString(36).substr(2, 8)
}

// ============================================================================
// Node Utilities
// ============================================================================

export const getNodeCategory = (type: NodeType): NodeCategory => {
  if (type.startsWith('trigger-')) return 'triggers'
  if (type.startsWith('action-')) return 'actions'
  if (type.startsWith('condition-') || type.startsWith('loop-') || type.startsWith('parallel-') || type === 'merge' || type === 'delay') return 'control-flow'
  if (type.startsWith('data-') || type.startsWith('variable-')) return 'data'
  if (type.startsWith('integration-')) return 'integrations'
  if (type.startsWith('error-') || type === 'retry' || type === 'fallback') return 'error-handling'
  return 'utility'
}

export const getNodeColor = (type: NodeType): string => {
  const category = getNodeCategory(type)
  const colors: Record<NodeCategory, string> = {
    'triggers': '#22c55e',      // green
    'actions': '#3b82f6',       // blue
    'control-flow': '#f59e0b',  // amber
    'data': '#8b5cf6',          // violet
    'integrations': '#ec4899',  // pink
    'error-handling': '#ef4444', // red
    'utility': '#6b7280',       // gray
  }
  return colors[category]
}

export const getNodeIcon = (type: NodeType): string => {
  const icons: Partial<Record<NodeType, string>> = {
    'trigger-webhook': 'Webhook',
    'trigger-schedule': 'Clock',
    'trigger-manual': 'Play',
    'trigger-event': 'Zap',
    'trigger-polling': 'RefreshCw',
    'action-http': 'Globe',
    'action-code': 'Code',
    'action-transform': 'Shuffle',
    'action-email': 'Mail',
    'action-database': 'Database',
    'action-file': 'File',
    'action-ai': 'Sparkles',
    'condition-if': 'GitBranch',
    'condition-switch': 'GitMerge',
    'condition-router': 'Route',
    'loop-foreach': 'Repeat',
    'loop-while': 'RotateCw',
    'parallel-branch': 'GitFork',
    'merge': 'Merge',
    'delay': 'Timer',
    'error-handler': 'AlertTriangle',
    'retry': 'RefreshCcw',
    'fallback': 'Shield',
    'data-store-get': 'Download',
    'data-store-set': 'Upload',
    'variable-set': 'Variable',
    'variable-get': 'Variable',
    'integration-api': 'Plug',
    'integration-webhook-out': 'Send',
    'comment': 'MessageSquare',
    'subworkflow': 'Workflow',
  }
  return icons[type] || 'Box'
}

export const createDefaultNode = (type: NodeType, position: { x: number; y: number }): Omit<WorkflowNode, 'id'> => {
  const category = getNodeCategory(type)
  const name = type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  
  const defaultInputs: NodePort[] = type.startsWith('trigger-') ? [] : [
    { id: 'input', name: 'Input', type: 'input', required: true }
  ]
  
  const defaultOutputs: NodePort[] = [
    { id: 'output', name: 'Output', type: 'output' }
  ]
  
  // Add error output for most nodes
  if (!type.startsWith('trigger-') && type !== 'comment') {
    defaultOutputs.push({ id: 'error', name: 'Error', type: 'output' })
  }
  
  // Special outputs for condition nodes
  if (type === 'condition-if') {
    return {
      type,
      name,
      position,
      config: { condition: '' },
      inputs: defaultInputs,
      outputs: [
        { id: 'true', name: 'True', type: 'output' },
        { id: 'false', name: 'False', type: 'output' },
        { id: 'error', name: 'Error', type: 'output' },
      ],
      metadata: { category, color: getNodeColor(type), icon: getNodeIcon(type) }
    }
  }
  
  if (type === 'condition-switch') {
    return {
      type,
      name,
      position,
      config: { expression: '', cases: [] },
      inputs: defaultInputs,
      outputs: [
        { id: 'case-1', name: 'Case 1', type: 'output' },
        { id: 'default', name: 'Default', type: 'output' },
        { id: 'error', name: 'Error', type: 'output' },
      ],
      metadata: { category, color: getNodeColor(type), icon: getNodeIcon(type) }
    }
  }
  
  if (type === 'loop-foreach') {
    return {
      type,
      name,
      position,
      config: { array: '', itemVariable: 'item', indexVariable: 'index' },
      inputs: defaultInputs,
      outputs: [
        { id: 'loop', name: 'Loop Body', type: 'output' },
        { id: 'complete', name: 'Complete', type: 'output' },
        { id: 'error', name: 'Error', type: 'output' },
      ],
      metadata: { category, color: getNodeColor(type), icon: getNodeIcon(type) }
    }
  }
  
  if (type === 'parallel-branch') {
    return {
      type,
      name,
      position,
      config: { branches: 2 },
      inputs: defaultInputs,
      outputs: [
        { id: 'branch-1', name: 'Branch 1', type: 'output' },
        { id: 'branch-2', name: 'Branch 2', type: 'output' },
        { id: 'error', name: 'Error', type: 'output' },
      ],
      metadata: { category, color: getNodeColor(type), icon: getNodeIcon(type) }
    }
  }
  
  return {
    type,
    name,
    position,
    config: getDefaultConfig(type),
    inputs: defaultInputs,
    outputs: defaultOutputs,
    metadata: { category, color: getNodeColor(type), icon: getNodeIcon(type) }
  }
}

export const getDefaultConfig = (type: NodeType): NodeConfig => {
  const configs: Partial<Record<NodeType, NodeConfig>> = {
    'trigger-webhook': {
      method: 'POST',
      path: '/webhook/' + generateShortId(),
      authentication: 'none',
      responseMode: 'immediate',
    },
    'trigger-schedule': {
      type: 'cron',
      cron: '0 * * * *',
      timezone: 'UTC',
      enabled: true,
    },
    'trigger-manual': {
      inputSchema: {},
    },
    'trigger-polling': {
      url: '',
      interval: 60000,
      method: 'GET',
    },
    'action-http': {
      method: 'GET',
      url: '',
      headers: {},
      body: '',
      timeout: 30000,
      retries: 0,
    },
    'action-code': {
      language: 'javascript',
      code: '// Your code here\nreturn input;',
    },
    'action-transform': {
      mode: 'jmespath',
      expression: '',
    },
    'action-email': {
      to: '',
      subject: '',
      body: '',
      isHtml: false,
    },
    'action-ai': {
      model: 'bitnet',
      prompt: '',
      temperature: 0.7,
      maxTokens: 1000,
    },
    'condition-if': {
      condition: '',
      operator: 'equals',
      value: '',
    },
    'condition-switch': {
      expression: '',
      cases: [
        { value: '', label: 'Case 1' }
      ],
    },
    'loop-foreach': {
      array: '{{input}}',
      itemVariable: 'item',
      indexVariable: 'index',
      maxIterations: 1000,
    },
    'loop-while': {
      condition: '',
      maxIterations: 100,
    },
    'delay': {
      duration: 1000,
      unit: 'milliseconds',
    },
    'error-handler': {
      errorTypes: ['all'],
      action: 'continue',
    },
    'retry': {
      maxRetries: 3,
      delay: 1000,
      backoff: 'exponential',
    },
    'data-store-get': {
      key: '',
      defaultValue: null,
    },
    'data-store-set': {
      key: '',
      value: '',
      ttl: null,
    },
  }
  return configs[type] || {}
}

// ============================================================================
// Graph Utilities
// ============================================================================

export const getConnectedNodes = (
  nodeId: string,
  edges: WorkflowEdge[],
  direction: 'incoming' | 'outgoing' | 'both' = 'both'
): string[] => {
  const connected: string[] = []
  
  edges.forEach(edge => {
    if (direction === 'incoming' || direction === 'both') {
      if (edge.target === nodeId) connected.push(edge.source)
    }
    if (direction === 'outgoing' || direction === 'both') {
      if (edge.source === nodeId) connected.push(edge.target)
    }
  })
  
  return [...new Set(connected)]
}

export const getExecutionOrder = (workflow: Workflow): string[] => {
  const order: string[] = []
  const visited = new Set<string>()
  const inProgress = new Set<string>()
  
  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return
    if (inProgress.has(nodeId)) {
      throw new Error(`Circular dependency detected at node: ${nodeId}`)
    }
    
    inProgress.add(nodeId)
    
    // Visit all nodes that this node depends on (incoming edges)
    const incoming = getConnectedNodes(nodeId, workflow.edges, 'incoming')
    incoming.forEach(visit)
    
    inProgress.delete(nodeId)
    visited.add(nodeId)
    order.push(nodeId)
  }
  
  // Start from trigger nodes
  workflow.triggers.forEach(triggerId => {
    if (!visited.has(triggerId)) {
      visit(triggerId)
    }
  })
  
  // Visit any remaining nodes
  workflow.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      visit(node.id)
    }
  })
  
  return order
}

export const validateWorkflow = (workflow: Workflow): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Check for at least one trigger
  if (workflow.triggers.length === 0) {
    errors.push('Workflow must have at least one trigger node')
  }
  
  // Check for orphan nodes (no connections)
  workflow.nodes.forEach(node => {
    if (!node.type.startsWith('trigger-') && node.type !== 'comment') {
      const hasIncoming = workflow.edges.some(e => e.target === node.id)
      if (!hasIncoming) {
        errors.push(`Node "${node.name}" has no incoming connections`)
      }
    }
  })
  
  // Check for circular dependencies
  try {
    getExecutionOrder(workflow)
  } catch (e: any) {
    errors.push(e.message)
  }
  
  // Validate node configurations
  workflow.nodes.forEach(node => {
    const configErrors = validateNodeConfig(node)
    errors.push(...configErrors.map(e => `${node.name}: ${e}`))
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateNodeConfig = (node: WorkflowNode): string[] => {
  const errors: string[] = []
  
  switch (node.type) {
    case 'action-http':
      if (!node.config.url) errors.push('URL is required')
      break
    case 'action-code':
      if (!node.config.code) errors.push('Code is required')
      break
    case 'trigger-webhook':
      if (!node.config.path) errors.push('Webhook path is required')
      break
    case 'trigger-schedule':
      if (node.config.type === 'cron' && !node.config.cron) {
        errors.push('Cron expression is required')
      }
      break
    case 'condition-if':
      if (!node.config.condition) errors.push('Condition is required')
      break
    case 'loop-foreach':
      if (!node.config.array) errors.push('Array expression is required')
      break
  }
  
  return errors
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

export const interpolateVariables = (template: string, variables: Record<string, any>): string => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(variables, path.trim())
    return value !== undefined ? String(value) : match
  })
}

export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined
    // Handle array access like items[0]
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch
      return current[arrayKey]?.[parseInt(index)]
    }
    return current[key]
  }, obj)
}

export const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (current[key] === undefined) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

// ============================================================================
// Export/Import Utilities
// ============================================================================

export const exportWorkflow = (workflow: Workflow): string => {
  return JSON.stringify(workflow, null, 2)
}

export const importWorkflow = (json: string): Workflow => {
  const workflow = JSON.parse(json)
  // Regenerate IDs to avoid conflicts
  const idMap: Record<string, string> = {}
  
  workflow.id = generateId()
  workflow.nodes = workflow.nodes.map((node: WorkflowNode) => {
    const newId = generateId()
    idMap[node.id] = newId
    return { ...node, id: newId }
  })
  
  workflow.edges = workflow.edges.map((edge: WorkflowEdge) => ({
    ...edge,
    id: generateId(),
    source: idMap[edge.source] || edge.source,
    target: idMap[edge.target] || edge.target,
  }))
  
  workflow.triggers = workflow.triggers.map((id: string) => idMap[id] || id)
  workflow.createdAt = new Date()
  workflow.updatedAt = new Date()
  
  return workflow
}

// ============================================================================
// Layout Utilities
// ============================================================================

export const autoLayoutNodes = (nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] => {
  const HORIZONTAL_SPACING = 250
  const VERTICAL_SPACING = 100
  const START_X = 100
  const START_Y = 100
  
  // Find trigger nodes (starting points)
  const triggerNodes = nodes.filter(n => n.type.startsWith('trigger-'))
  const visited = new Set<string>()
  const positions: Record<string, { x: number; y: number }> = {}
  
  let currentY = START_Y
  
  const layoutBranch = (nodeId: string, x: number, y: number): number => {
    if (visited.has(nodeId)) return y
    visited.add(nodeId)
    
    positions[nodeId] = { x, y }
    
    // Get outgoing connections
    const outgoing = edges.filter(e => e.source === nodeId)
    let maxY = y
    
    outgoing.forEach((edge, index) => {
      const targetY = y + (index * VERTICAL_SPACING)
      const resultY = layoutBranch(edge.target, x + HORIZONTAL_SPACING, targetY)
      maxY = Math.max(maxY, resultY)
    })
    
    return maxY + VERTICAL_SPACING
  }
  
  // Layout each trigger branch
  triggerNodes.forEach(trigger => {
    currentY = layoutBranch(trigger.id, START_X, currentY)
  })
  
  // Apply positions
  return nodes.map(node => ({
    ...node,
    position: positions[node.id] || node.position
  }))
}
