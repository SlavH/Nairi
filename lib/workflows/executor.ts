/**
 * Nairi AI Workflow Builder - Execution Engine
 * Handles workflow execution with support for parallel branches, loops, and error handling
 */

import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  ExecutionNodeResult,
  ExecutionLog,
  ExecutionStatus,
  ExecutionContext,
  NodeConfig,
  NodeType
} from './types'
import { getConnectedNodes, interpolateVariables, getNestedValue } from './utils'
import { generateWithFallback } from '@/lib/ai/groq-direct'

// ============================================================================
// Execution Engine
// ============================================================================

export class WorkflowExecutor {
  private workflow: Workflow
  private execution: WorkflowExecution
  private variables: Record<string, any>
  private dataStore: Map<string, any>
  private nodeResults: Map<string, ExecutionNodeResult>
  private abortController: AbortController
  private eventEmitter: EventTarget
  private breakpoints: Set<string>
  private isPaused: boolean
  private pausePromise: Promise<void> | null
  private pauseResolve: (() => void) | null

  constructor(workflow: Workflow, triggerData?: any) {
    this.workflow = workflow
    this.variables = {
      ...Object.fromEntries(
        workflow.variables.map(v => [v.name, v.defaultValue])
      ),
      trigger: triggerData || {},
      env: process.env,
    }
    this.dataStore = new Map()
    this.nodeResults = new Map()
    this.abortController = new AbortController()
    this.eventEmitter = new EventTarget()
    this.breakpoints = new Set()
    this.isPaused = false
    this.pausePromise = null
    this.pauseResolve = null

    this.execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      status: 'pending',
      triggeredBy: 'manual',
      triggerData,
      startTime: new Date(),
      nodeResults: [],
      logs: [],
      variables: this.variables,
    }
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  async execute(): Promise<WorkflowExecution> {
    this.execution.status = 'running'
    this.execution.startTime = new Date()
    this.emit('execution:start', { executionId: this.execution.id })

    try {
      // Find trigger nodes
      const triggerNodes = this.workflow.nodes.filter(n => 
        this.workflow.triggers.includes(n.id)
      )

      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow')
      }

      // Execute from each trigger (usually just one for manual execution)
      for (const trigger of triggerNodes) {
        await this.executeNode(trigger, this.variables.trigger)
      }

      this.execution.status = 'completed'
    } catch (error: any) {
      this.execution.status = 'failed'
      this.execution.error = {
        message: error.message,
        stack: error.stack,
      }
      this.log('error', `Workflow execution failed: ${error.message}`)
    } finally {
      this.execution.endTime = new Date()
      this.execution.duration = 
        this.execution.endTime.getTime() - this.execution.startTime.getTime()
      this.execution.nodeResults = Array.from(this.nodeResults.values())
      this.emit('execution:complete', { 
        executionId: this.execution.id,
        status: this.execution.status 
      })
    }

    return this.execution
  }

  abort(): void {
    this.abortController.abort()
    this.execution.status = 'cancelled'
    this.emit('execution:abort', { executionId: this.execution.id })
  }

  pause(): void {
    this.isPaused = true
    this.pausePromise = new Promise(resolve => {
      this.pauseResolve = resolve
    })
    this.execution.status = 'paused'
    this.emit('execution:pause', { executionId: this.execution.id })
  }

  resume(): void {
    if (this.pauseResolve) {
      this.pauseResolve()
      this.pauseResolve = null
      this.pausePromise = null
    }
    this.isPaused = false
    this.execution.status = 'running'
    this.emit('execution:resume', { executionId: this.execution.id })
  }

  setBreakpoint(nodeId: string): void {
    this.breakpoints.add(nodeId)
  }

  removeBreakpoint(nodeId: string): void {
    this.breakpoints.delete(nodeId)
  }

  getExecution(): WorkflowExecution {
    return this.execution
  }

  on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.addEventListener(event, (e: any) => callback(e.detail))
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async executeNode(node: WorkflowNode, input: any): Promise<any> {
    // Check for abort
    if (this.abortController.signal.aborted) {
      throw new Error('Execution aborted')
    }

    // Check for pause
    if (this.isPaused && this.pausePromise) {
      await this.pausePromise
    }

    // Check for breakpoint
    if (this.breakpoints.has(node.id)) {
      this.pause()
      this.emit('execution:breakpoint', { nodeId: node.id, input })
      if (this.pausePromise) await this.pausePromise
    }

    // Skip disabled nodes
    if (node.isDisabled) {
      this.log('info', `Skipping disabled node: ${node.name}`, undefined, node.id)
      return input
    }

    const result: ExecutionNodeResult = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: 'running',
      startTime: new Date(),
      input,
      logs: [],
    }

    this.nodeResults.set(node.id, result)
    this.emit('node:start', { nodeId: node.id, input })

    try {
      // Create execution context
      const context = this.createContext(node.id)

      // Execute based on node type
      const output = await this.executeNodeByType(node, input, context)

      result.status = 'completed'
      result.output = output
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - result.startTime.getTime()

      this.emit('node:complete', { nodeId: node.id, output })

      // Store result in variables for downstream nodes
      this.variables[`nodes.${node.id}`] = output
      this.variables.lastOutput = output

      // Execute downstream nodes
      await this.executeDownstream(node, output)

      return output
    } catch (error: any) {
      result.status = 'failed'
      result.error = {
        message: error.message,
        stack: error.stack,
      }
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - result.startTime.getTime()

      this.emit('node:error', { nodeId: node.id, error: error.message })

      // Check for error handling
      const errorEdge = this.workflow.edges.find(
        e => e.source === node.id && e.sourcePort === 'error'
      )

      if (errorEdge) {
        const errorNode = this.workflow.nodes.find(n => n.id === errorEdge.target)
        if (errorNode) {
          await this.executeNode(errorNode, { error: error.message, input })
          return
        }
      }

      // Check workflow error handling settings
      if (this.workflow.settings.errorHandling === 'continue') {
        this.log('warn', `Node ${node.name} failed but continuing: ${error.message}`, undefined, node.id)
        return input
      }

      throw error
    }
  }

  private async executeNodeByType(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    const config = this.interpolateConfig(node.config)

    switch (node.type) {
      // Triggers
      case 'trigger-webhook':
      case 'trigger-manual':
      case 'trigger-event':
        return input

      case 'trigger-schedule':
        return { scheduledTime: new Date(), ...input }

      // Actions
      case 'action-http':
        return this.executeHttpAction(config, input)

      case 'action-code':
        return this.executeCodeAction(config, input, context)

      case 'action-transform':
        return this.executeTransformAction(config, input)

      case 'action-ai':
        return this.executeAIAction(config, input)

      // Control Flow
      case 'condition-if':
        return this.executeIfCondition(node, config, input)

      case 'condition-switch':
        return this.executeSwitchCondition(node, config, input)

      case 'loop-foreach':
        return this.executeForEachLoop(node, config, input)

      case 'loop-while':
        return this.executeWhileLoop(node, config, input)

      case 'parallel-branch':
        return this.executeParallelBranch(node, input)

      case 'merge':
        return this.executeMerge(node, input)

      case 'delay':
        return this.executeDelay(config, input)

      // Data
      case 'data-store-get':
        return this.dataStore.get(config.key) ?? config.defaultValue

      case 'data-store-set':
        this.dataStore.set(config.key, config.value)
        return input

      case 'variable-set':
        this.variables[config.name] = config.value
        return input

      case 'variable-get':
        return this.variables[config.name]

      // Error Handling
      case 'error-handler':
        return input

      case 'retry':
        return this.executeRetry(node, config, input)

      case 'fallback':
        return config.fallbackValue ?? input

      default:
        this.log('warn', `Unknown node type: ${node.type}`, undefined, node.id)
        return input
    }
  }

  private async executeDownstream(node: WorkflowNode, output: any): Promise<void> {
    // Find outgoing edges (excluding error edges for successful execution)
    const outgoingEdges = this.workflow.edges.filter(
      e => e.source === node.id && e.sourcePort !== 'error'
    )

    // Execute downstream nodes
    for (const edge of outgoingEdges) {
      const targetNode = this.workflow.nodes.find(n => n.id === edge.target)
      if (targetNode) {
        await this.executeNode(targetNode, output)
      }
    }
  }

  // ============================================================================
  // Node Type Executors
  // ============================================================================

  private async executeHttpAction(config: NodeConfig, input: any): Promise<any> {
    const { method, url, headers, body, timeout } = config

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout || 30000)

    try {
      const response = await fetch(url, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' ? JSON.stringify(body || input) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = response.headers.get('content-type')
      let data

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      throw new Error(`HTTP request failed: ${error.message}`)
    }
  }

  private async executeCodeAction(
    config: NodeConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    const { language, code } = config

    if (language === 'javascript') {
      // Create a sandboxed function
      const fn = new Function(
        'input',
        'variables',
        'context',
        'console',
        `
        const log = context.log;
        ${code}
        `
      )

      const safeConsole = {
        log: (...args: any[]) => context.log('info', args.map(String).join(' ')),
        warn: (...args: any[]) => context.log('warn', args.map(String).join(' ')),
        error: (...args: any[]) => context.log('error', args.map(String).join(' ')),
      }

      return await fn(input, this.variables, context, safeConsole)
    }

    throw new Error(`Unsupported language: ${language}`)
  }

  private async executeTransformAction(config: NodeConfig, input: any): Promise<any> {
    const { mode, expression } = config

    if (mode === 'jmespath') {
      // Simple path-based extraction
      return getNestedValue(input, expression)
    }

    if (mode === 'template') {
      return interpolateVariables(expression, { input, ...this.variables })
    }

    if (mode === 'json') {
      return JSON.parse(interpolateVariables(expression, { input, ...this.variables }))
    }

    return input
  }

  private async executeAIAction(config: NodeConfig, input: any): Promise<any> {
    const { model, prompt, temperature, maxTokens } = config
    const resolvedPrompt = interpolateVariables(
      typeof prompt === 'string' ? prompt : '',
      { input, ...this.variables }
    )

    this.log('info', `AI action calling model with prompt (${resolvedPrompt.length} chars)`)

    try {
      const { text, model: usedModel } = await generateWithFallback({
        system: 'You are a helpful workflow assistant. Respond concisely and in plain text.',
        prompt: resolvedPrompt,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
        fast: true,
      })

      return {
        model: usedModel,
        prompt: resolvedPrompt,
        response: text,
      }
    } catch (error: any) {
      this.log('error', `AI action failed: ${error?.message ?? error}`)
      throw error
    }
  }

  private async executeIfCondition(
    node: WorkflowNode,
    config: NodeConfig,
    input: any
  ): Promise<any> {
    const { condition, operator, value } = config
    const leftValue = getNestedValue({ input, ...this.variables }, condition)
    
    let result = false

    switch (operator) {
      case 'equals':
        result = leftValue === value
        break
      case 'notEquals':
        result = leftValue !== value
        break
      case 'contains':
        result = String(leftValue).includes(value)
        break
      case 'greaterThan':
        result = Number(leftValue) > Number(value)
        break
      case 'lessThan':
        result = Number(leftValue) < Number(value)
        break
      case 'isEmpty':
        result = !leftValue || (Array.isArray(leftValue) && leftValue.length === 0)
        break
      case 'isNotEmpty':
        result = !!leftValue && (!Array.isArray(leftValue) || leftValue.length > 0)
        break
      case 'matches':
        result = new RegExp(value).test(String(leftValue))
        break
      default:
        result = Boolean(leftValue)
    }

    // Execute the appropriate branch
    const branchPort = result ? 'true' : 'false'
    const branchEdge = this.workflow.edges.find(
      e => e.source === node.id && e.sourcePort === branchPort
    )

    if (branchEdge) {
      const branchNode = this.workflow.nodes.find(n => n.id === branchEdge.target)
      if (branchNode) {
        await this.executeNode(branchNode, input)
      }
    }

    return { condition: result, input }
  }

  private async executeSwitchCondition(
    node: WorkflowNode,
    config: NodeConfig,
    input: any
  ): Promise<any> {
    const { expression, cases } = config
    const value = getNestedValue({ input, ...this.variables }, expression)

    let matchedCase = cases.find((c: any) => c.value === value)
    let portId = matchedCase ? `case-${cases.indexOf(matchedCase) + 1}` : 'default'

    const edge = this.workflow.edges.find(
      e => e.source === node.id && e.sourcePort === portId
    )

    if (edge) {
      const targetNode = this.workflow.nodes.find(n => n.id === edge.target)
      if (targetNode) {
        await this.executeNode(targetNode, input)
      }
    }

    return { matchedCase: matchedCase?.label || 'default', input }
  }

  private async executeForEachLoop(
    node: WorkflowNode,
    config: NodeConfig,
    input: any
  ): Promise<any> {
    const { array, itemVariable, indexVariable, maxIterations } = config
    const items = getNestedValue({ input, ...this.variables }, array) || input

    if (!Array.isArray(items)) {
      throw new Error('ForEach loop requires an array input')
    }

    const results: any[] = []
    const limit = Math.min(items.length, maxIterations || 1000)

    // Find the loop body edge
    const loopEdge = this.workflow.edges.find(
      e => e.source === node.id && e.sourcePort === 'loop'
    )

    for (let i = 0; i < limit; i++) {
      this.variables[itemVariable] = items[i]
      this.variables[indexVariable] = i

      if (loopEdge) {
        const loopNode = this.workflow.nodes.find(n => n.id === loopEdge.target)
        if (loopNode) {
          const result = await this.executeNode(loopNode, items[i])
          results.push(result)
        }
      }
    }

    // Execute complete branch
    const completeEdge = this.workflow.edges.find(
      e => e.source === node.id && e.sourcePort === 'complete'
    )

    if (completeEdge) {
      const completeNode = this.workflow.nodes.find(n => n.id === completeEdge.target)
      if (completeNode) {
        await this.executeNode(completeNode, results)
      }
    }

    return results
  }

  private async executeWhileLoop(
    node: WorkflowNode,
    config: NodeConfig,
    input: any
  ): Promise<any> {
    const { condition, maxIterations } = config
    const results: any[] = []
    let iterations = 0
    let currentInput = input

    while (iterations < (maxIterations || 100)) {
      const conditionResult = getNestedValue(
        { input: currentInput, ...this.variables },
        condition
      )

      if (!conditionResult) break

      const loopEdge = this.workflow.edges.find(
        e => e.source === node.id && e.sourcePort === 'loop'
      )

      if (loopEdge) {
        const loopNode = this.workflow.nodes.find(n => n.id === loopEdge.target)
        if (loopNode) {
          currentInput = await this.executeNode(loopNode, currentInput)
          results.push(currentInput)
        }
      }

      iterations++
    }

    return results
  }

  private async executeParallelBranch(node: WorkflowNode, input: any): Promise<any> {
    const branchEdges = this.workflow.edges.filter(
      e => e.source === node.id && e.sourcePort.startsWith('branch-')
    )

    const branchPromises = branchEdges.map(async edge => {
      const branchNode = this.workflow.nodes.find(n => n.id === edge.target)
      if (branchNode) {
        return this.executeNode(branchNode, input)
      }
      return null
    })

    const results = await Promise.all(branchPromises)
    return results.filter(r => r !== null)
  }

  private async executeMerge(node: WorkflowNode, input: any): Promise<any> {
    // Merge simply passes through - the actual merging happens
    // when multiple branches connect to this node
    return Array.isArray(input) ? input : [input]
  }

  private async executeDelay(config: NodeConfig, input: any): Promise<any> {
    const { duration, unit } = config
    let ms = duration

    switch (unit) {
      case 'seconds':
        ms = duration * 1000
        break
      case 'minutes':
        ms = duration * 60 * 1000
        break
      case 'hours':
        ms = duration * 60 * 60 * 1000
        break
    }

    await new Promise(resolve => setTimeout(resolve, ms))
    return input
  }

  private async executeRetry(
    node: WorkflowNode,
    config: NodeConfig,
    input: any
  ): Promise<any> {
    const { maxRetries, delay, backoff } = config
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Find the node to retry (connected via output)
        const retryEdge = this.workflow.edges.find(
          e => e.source === node.id && e.sourcePort === 'output'
        )

        if (retryEdge) {
          const retryNode = this.workflow.nodes.find(n => n.id === retryEdge.target)
          if (retryNode) {
            return await this.executeNode(retryNode, input)
          }
        }

        return input
      } catch (error: any) {
        lastError = error
        this.log('warn', `Retry attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`, undefined, node.id)

        if (attempt < maxRetries) {
          const waitTime = backoff === 'exponential'
            ? delay * Math.pow(2, attempt)
            : delay
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw lastError || new Error('Retry failed')
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createContext(nodeId: string): ExecutionContext {
    return {
      workflowId: this.workflow.id,
      executionId: this.execution.id,
      nodeId,
      input: this.variables.lastOutput,
      variables: this.variables,
      dataStore: {
        get: async (key: string) => this.dataStore.get(key),
        set: async (key: string, value: any) => {
          this.dataStore.set(key, value)
        },
        delete: async (key: string) => {
          this.dataStore.delete(key)
        },
      },
      log: (level, message, data) => this.log(level, message, data, nodeId),
      emit: (event, data) => this.emit(event, data),
    }
  }

  private interpolateConfig(config: NodeConfig): NodeConfig {
    const interpolated: NodeConfig = {}

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        interpolated[key] = interpolateVariables(value, this.variables)
      } else if (typeof value === 'object' && value !== null) {
        interpolated[key] = this.interpolateConfig(value)
      } else {
        interpolated[key] = value
      }
    }

    return interpolated
  }

  private log(
    level: ExecutionLog['level'],
    message: string,
    data?: any,
    nodeId?: string
  ): void {
    const log: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      data,
      nodeId,
    }

    this.execution.logs.push(log)

    if (nodeId) {
      const nodeResult = this.nodeResults.get(nodeId)
      if (nodeResult) {
        nodeResult.logs = nodeResult.logs || []
        nodeResult.logs.push(log)
      }
    }

    this.emit('log', log)
  }

  private emit(event: string, data: any): void {
    this.eventEmitter.dispatchEvent(
      new CustomEvent(event, { detail: data })
    )
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export const createExecutor = (
  workflow: Workflow,
  triggerData?: any
): WorkflowExecutor => {
  return new WorkflowExecutor(workflow, triggerData)
}
