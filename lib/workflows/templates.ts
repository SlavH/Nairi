/**
 * Nairi AI Workflow Builder - Workflow Templates
 * Pre-built starter templates for common automation scenarios
 */

import { WorkflowTemplate, Workflow, WorkflowNode, WorkflowEdge } from './types'

// ============================================================================
// Template Categories
// ============================================================================

export const TEMPLATE_CATEGORIES = [
  { id: 'data-processing', name: 'Data Processing', icon: 'Database' },
  { id: 'api-integration', name: 'API Integration', icon: 'Globe' },
  { id: 'notifications', name: 'Notifications', icon: 'Bell' },
  { id: 'scheduling', name: 'Scheduling', icon: 'Clock' },
  { id: 'ai-automation', name: 'AI Automation', icon: 'Sparkles' },
  { id: 'error-handling', name: 'Error Handling', icon: 'AlertTriangle' },
  { id: 'data-sync', name: 'Data Sync', icon: 'RefreshCw' },
  { id: 'webhooks', name: 'Webhooks', icon: 'Webhook' },
]

// ============================================================================
// Workflow Templates
// ============================================================================

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ============================================================================
  // Basic Webhook Handler
  // ============================================================================
  {
    id: 'webhook-handler',
    name: 'Webhook Handler',
    description: 'Receive webhook data, process it, and send a response',
    category: 'webhooks',
    tags: ['webhook', 'api', 'basic'],
    isOfficial: true,
    popularity: 95,
    workflow: {
      name: 'Webhook Handler',
      description: 'Basic webhook handler template',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-webhook',
          name: 'Webhook Trigger',
          position: { x: 100, y: 200 },
          config: {
            method: 'POST',
            path: '/webhook/handler',
            authentication: 'none',
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Webhook' },
        },
        {
          id: 'transform-1',
          type: 'action-transform',
          name: 'Process Data',
          position: { x: 350, y: 200 },
          config: {
            mode: 'template',
            expression: '{{input}}',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Shuffle' },
        },
        {
          id: 'http-1',
          type: 'action-http',
          name: 'Send Response',
          position: { x: 600, y: 200 },
          config: {
            method: 'POST',
            url: 'https://api.example.com/callback',
            headers: { 'Content-Type': 'application/json' },
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'transform-1', targetPort: 'input' },
        { id: 'edge-2', source: 'transform-1', sourcePort: 'output', target: 'http-1', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 30000,
        retryCount: 3,
        errorHandling: 'stop',
        logging: 'normal',
      },
      triggers: ['trigger-1'],
    },
  },

  // ============================================================================
  // Scheduled Data Sync
  // ============================================================================
  {
    id: 'scheduled-sync',
    name: 'Scheduled Data Sync',
    description: 'Periodically fetch data from an API and process it',
    category: 'scheduling',
    tags: ['schedule', 'cron', 'sync', 'api'],
    isOfficial: true,
    popularity: 88,
    workflow: {
      name: 'Scheduled Data Sync',
      description: 'Sync data on a schedule',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-schedule',
          name: 'Every Hour',
          position: { x: 100, y: 200 },
          config: {
            type: 'cron',
            cron: '0 * * * *',
            timezone: 'UTC',
            enabled: true,
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Clock' },
        },
        {
          id: 'http-1',
          type: 'action-http',
          name: 'Fetch Data',
          position: { x: 350, y: 200 },
          config: {
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: {},
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
        {
          id: 'loop-1',
          type: 'loop-foreach',
          name: 'Process Each Item',
          position: { x: 600, y: 200 },
          config: {
            array: '{{input.data}}',
            itemVariable: 'item',
            indexVariable: 'index',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'loop', name: 'Loop Body', type: 'output' },
            { id: 'complete', name: 'Complete', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'control-flow', color: '#f59e0b', icon: 'Repeat' },
        },
        {
          id: 'transform-1',
          type: 'action-transform',
          name: 'Transform Item',
          position: { x: 850, y: 150 },
          config: {
            mode: 'template',
            expression: '{ "id": "{{item.id}}", "processed": true }',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Shuffle' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'http-1', targetPort: 'input' },
        { id: 'edge-2', source: 'http-1', sourcePort: 'output', target: 'loop-1', targetPort: 'input' },
        { id: 'edge-3', source: 'loop-1', sourcePort: 'loop', target: 'transform-1', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 300000,
        retryCount: 3,
        errorHandling: 'continue',
        logging: 'normal',
      },
      triggers: ['trigger-1'],
    },
  },

  // ============================================================================
  // Conditional Routing
  // ============================================================================
  {
    id: 'conditional-routing',
    name: 'Conditional Routing',
    description: 'Route data based on conditions with if/else branching',
    category: 'data-processing',
    tags: ['condition', 'routing', 'branching'],
    isOfficial: true,
    popularity: 82,
    workflow: {
      name: 'Conditional Routing',
      description: 'Route data based on conditions',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-manual',
          name: 'Manual Trigger',
          position: { x: 100, y: 250 },
          config: {},
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Play' },
        },
        {
          id: 'condition-1',
          type: 'condition-if',
          name: 'Check Status',
          position: { x: 350, y: 250 },
          config: {
            condition: 'input.status',
            operator: 'equals',
            value: 'active',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'true', name: 'True', type: 'output' },
            { id: 'false', name: 'False', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'control-flow', color: '#f59e0b', icon: 'GitBranch' },
        },
        {
          id: 'action-1',
          type: 'action-code',
          name: 'Process Active',
          position: { x: 600, y: 150 },
          config: {
            language: 'javascript',
            code: '// Process active items\nreturn { ...input, processed: true, processedAt: new Date() };',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Code' },
        },
        {
          id: 'action-2',
          type: 'action-code',
          name: 'Process Inactive',
          position: { x: 600, y: 350 },
          config: {
            language: 'javascript',
            code: '// Handle inactive items\nreturn { ...input, archived: true, archivedAt: new Date() };',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Code' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'condition-1', targetPort: 'input' },
        { id: 'edge-2', source: 'condition-1', sourcePort: 'true', target: 'action-1', targetPort: 'input' },
        { id: 'edge-3', source: 'condition-1', sourcePort: 'false', target: 'action-2', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 30000,
        retryCount: 0,
        errorHandling: 'stop',
        logging: 'normal',
      },
      triggers: ['trigger-1'],
    },
  },

  // ============================================================================
  // Error Handling with Retry
  // ============================================================================
  {
    id: 'error-handling-retry',
    name: 'Error Handling with Retry',
    description: 'Handle errors gracefully with automatic retries and fallback',
    category: 'error-handling',
    tags: ['error', 'retry', 'fallback', 'resilience'],
    isOfficial: true,
    popularity: 75,
    workflow: {
      name: 'Error Handling with Retry',
      description: 'Robust error handling pattern',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-manual',
          name: 'Start',
          position: { x: 100, y: 200 },
          config: {},
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Play' },
        },
        {
          id: 'retry-1',
          type: 'retry',
          name: 'Retry Logic',
          position: { x: 350, y: 200 },
          config: {
            maxRetries: 3,
            delay: 1000,
            backoff: 'exponential',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'error-handling', color: '#ef4444', icon: 'RefreshCcw' },
        },
        {
          id: 'http-1',
          type: 'action-http',
          name: 'API Call',
          position: { x: 600, y: 200 },
          config: {
            method: 'GET',
            url: 'https://api.example.com/data',
            timeout: 5000,
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
        {
          id: 'fallback-1',
          type: 'fallback',
          name: 'Fallback Handler',
          position: { x: 600, y: 350 },
          config: {
            fallbackValue: { error: true, message: 'Using fallback data' },
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
          ],
          metadata: { category: 'error-handling', color: '#ef4444', icon: 'Shield' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'retry-1', targetPort: 'input' },
        { id: 'edge-2', source: 'retry-1', sourcePort: 'output', target: 'http-1', targetPort: 'input' },
        { id: 'edge-3', source: 'retry-1', sourcePort: 'error', target: 'fallback-1', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 60000,
        retryCount: 0,
        errorHandling: 'stop',
        logging: 'verbose',
      },
      triggers: ['trigger-1'],
    },
  },

  // ============================================================================
  // Parallel Processing
  // ============================================================================
  {
    id: 'parallel-processing',
    name: 'Parallel Processing',
    description: 'Execute multiple branches in parallel for faster processing',
    category: 'data-processing',
    tags: ['parallel', 'performance', 'concurrent'],
    isOfficial: true,
    popularity: 70,
    workflow: {
      name: 'Parallel Processing',
      description: 'Process data in parallel branches',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-manual',
          name: 'Start',
          position: { x: 100, y: 250 },
          config: {},
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Play' },
        },
        {
          id: 'parallel-1',
          type: 'parallel-branch',
          name: 'Split',
          position: { x: 350, y: 250 },
          config: { branches: 3 },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'branch-1', name: 'Branch 1', type: 'output' },
            { id: 'branch-2', name: 'Branch 2', type: 'output' },
            { id: 'branch-3', name: 'Branch 3', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'control-flow', color: '#f59e0b', icon: 'GitFork' },
        },
        {
          id: 'action-1',
          type: 'action-http',
          name: 'API 1',
          position: { x: 600, y: 100 },
          config: { method: 'GET', url: 'https://api1.example.com' },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }, { id: 'error', name: 'Error', type: 'output' }],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
        {
          id: 'action-2',
          type: 'action-http',
          name: 'API 2',
          position: { x: 600, y: 250 },
          config: { method: 'GET', url: 'https://api2.example.com' },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }, { id: 'error', name: 'Error', type: 'output' }],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
        {
          id: 'action-3',
          type: 'action-http',
          name: 'API 3',
          position: { x: 600, y: 400 },
          config: { method: 'GET', url: 'https://api3.example.com' },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }, { id: 'error', name: 'Error', type: 'output' }],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Globe' },
        },
        {
          id: 'merge-1',
          type: 'merge',
          name: 'Merge Results',
          position: { x: 850, y: 250 },
          config: {},
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true, multiple: true }],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'control-flow', color: '#f59e0b', icon: 'Merge' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'parallel-1', targetPort: 'input' },
        { id: 'edge-2', source: 'parallel-1', sourcePort: 'branch-1', target: 'action-1', targetPort: 'input' },
        { id: 'edge-3', source: 'parallel-1', sourcePort: 'branch-2', target: 'action-2', targetPort: 'input' },
        { id: 'edge-4', source: 'parallel-1', sourcePort: 'branch-3', target: 'action-3', targetPort: 'input' },
        { id: 'edge-5', source: 'action-1', sourcePort: 'output', target: 'merge-1', targetPort: 'input' },
        { id: 'edge-6', source: 'action-2', sourcePort: 'output', target: 'merge-1', targetPort: 'input' },
        { id: 'edge-7', source: 'action-3', sourcePort: 'output', target: 'merge-1', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 60000,
        concurrencyLimit: 10,
        errorHandling: 'continue',
        logging: 'normal',
      },
      triggers: ['trigger-1'],
    },
  },

  // ============================================================================
  // AI Data Processing
  // ============================================================================
  {
    id: 'ai-data-processing',
    name: 'AI Data Processing',
    description: 'Use AI to analyze and transform data automatically',
    category: 'ai-automation',
    tags: ['ai', 'gpt', 'analysis', 'automation'],
    isOfficial: true,
    popularity: 90,
    workflow: {
      name: 'AI Data Processing',
      description: 'AI-powered data analysis workflow',
      version: '1.0.0',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger-webhook',
          name: 'Receive Data',
          position: { x: 100, y: 200 },
          config: {
            method: 'POST',
            path: '/ai/process',
          },
          inputs: [],
          outputs: [{ id: 'output', name: 'Output', type: 'output' }],
          metadata: { category: 'triggers', color: '#22c55e', icon: 'Webhook' },
        },
        {
          id: 'ai-1',
          type: 'action-ai',
          name: 'AI Analysis',
          position: { x: 350, y: 200 },
          config: {
            model: 'bitnet',
            prompt: 'Analyze the following data and provide insights:\n\n{{input}}',
            temperature: 0.7,
            maxTokens: 2000,
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Sparkles' },
        },
        {
          id: 'transform-1',
          type: 'action-transform',
          name: 'Format Response',
          position: { x: 600, y: 200 },
          config: {
            mode: 'json',
            expression: '{ "analysis": "{{input.response}}", "timestamp": "{{now}}" }',
          },
          inputs: [{ id: 'input', name: 'Input', type: 'input', required: true }],
          outputs: [
            { id: 'output', name: 'Output', type: 'output' },
            { id: 'error', name: 'Error', type: 'output' },
          ],
          metadata: { category: 'actions', color: '#3b82f6', icon: 'Shuffle' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'trigger-1', sourcePort: 'output', target: 'ai-1', targetPort: 'input' },
        { id: 'edge-2', source: 'ai-1', sourcePort: 'output', target: 'transform-1', targetPort: 'input' },
      ],
      variables: [],
      settings: {
        timeout: 120000,
        retryCount: 2,
        errorHandling: 'stop',
        logging: 'verbose',
      },
      triggers: ['trigger-1'],
    },
  },
]

// ============================================================================
// Template Utilities
// ============================================================================

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return WORKFLOW_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export const getPopularTemplates = (limit: number = 5): WorkflowTemplate[] => {
  return [...WORKFLOW_TEMPLATES]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit)
}

export const createWorkflowFromTemplate = (template: WorkflowTemplate): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    ...template.workflow,
    name: `${template.name} (Copy)`,
    status: 'draft',
  }
}
