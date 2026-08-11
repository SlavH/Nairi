/**
 * Nairi AI Workflow Builder - Workflow Execution API
 * Execute workflows using the real WorkflowExecutor and stream results
 */

import { NextRequest, NextResponse } from 'next/server'

import { WorkflowExecutor } from '@/lib/workflows/executor'
import type { WorkflowExecution, ExecutionNodeResult, ExecutionLog } from '@/lib/workflows/types'

// In-memory execution storage for GET/DELETE
const executions = new Map<string, any>()

function serializeExecution(exec: WorkflowExecution): any {
  return {
    id: exec.id,
    workflowId: exec.workflowId,
    workflowVersion: exec.workflowVersion,
    status: exec.status,
    triggeredBy: exec.triggeredBy,
    triggerData: exec.triggerData,
    startTime: exec.startTime instanceof Date ? exec.startTime.toISOString() : exec.startTime,
    endTime: exec.endTime instanceof Date ? exec.endTime?.toISOString() : exec.endTime,
    duration: exec.duration,
    nodeResults: (exec.nodeResults || []).map((r: ExecutionNodeResult) => ({
      nodeId: r.nodeId,
      nodeName: r.nodeName,
      nodeType: r.nodeType,
      status: r.status,
      startTime: r.startTime instanceof Date ? r.startTime.toISOString() : r.startTime,
      endTime: r.endTime instanceof Date ? r.endTime?.toISOString() : r.endTime,
      duration: r.duration,
      output: r.output,
      error: r.error,
    })),
    logs: (exec.logs || []).map((l: ExecutionLog) => ({
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
      level: l.level,
      message: l.message,
      nodeId: l.nodeId,
      data: l.data,
    })),
    variables: exec.variables,
    error: exec.error,
  }
}

// POST - Execute a workflow using WorkflowExecutor
export async function POST(request: NextRequest) {
  try {
    // Auth enforcement: executing workflows can run arbitrary code nodes
    // (vm sandbox), so it must require an authenticated user.
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workflowId, triggerData, options } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      )
    }

    // Load workflow from DB with ownership check
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', user.id)
      .single()

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if workflow execution is enabled
    if (process.env.NAIRI_ENABLE_WORKFLOW_EXEC !== 'true') {
      return NextResponse.json(
        { error: 'Workflow execution is disabled' },
        { status: 403 }
      )
    }

    // Check credits/rate limit (placeholder - implement based on your credit system)
    // TODO: Implement credit check and consumption

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const executor = new WorkflowExecutor(workflow, triggerData)
        const exec = (executor as any).execution as WorkflowExecution

        executor.on('node:start', (data: { nodeId: string; input: any }) => {
          const node = workflow.nodes.find((n: any) => n.id === data.nodeId)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'node-start',
                nodeId: data.nodeId,
                nodeName: node?.name ?? data.nodeId,
              }) + '\n'
            )
          )
        })

        executor.on('node:complete', (data: { nodeId: string; output: any }) => {
          const result = exec.nodeResults?.find((r: any) => r.nodeId === data.nodeId) ?? {} as { nodeName?: string; nodeType?: string; startTime?: Date | string; endTime?: Date | string; duration?: number }
          const nodeResult = {
            nodeId: data.nodeId,
            nodeName: result.nodeName ?? data.nodeId,
            nodeType: result.nodeType,
            status: 'completed',
            startTime: result.startTime instanceof Date ? result.startTime.toISOString() : result.startTime,
            endTime: result.endTime instanceof Date ? result.endTime?.toISOString() : result.endTime,
            duration: result.duration,
            output: data.output,
          }
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: 'node-complete', nodeId: data.nodeId, result: nodeResult }) + '\n'
            )
          )
        })

        executor.on('log', (log: ExecutionLog) => {
          const entry = {
            timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
            level: log.level,
            message: log.message,
            nodeId: log.nodeId,
          }
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'log', log: entry }) + '\n')
          )
        })

        executions.set(exec.id, serializeExecution(exec))

        try {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'execution-start',
                execution: serializeExecution(exec),
              }) + '\n'
            )
          )

          await executor.execute()

          const final = (executor as any).execution as WorkflowExecution
          executions.set(final.id, serializeExecution(final))

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'execution-complete',
                execution: serializeExecution(final),
              }) + '\n'
            )
          )
        } catch (error: any) {
          const final = (executor as any).execution as WorkflowExecution
          final.status = 'failed'
          final.error = { message: error?.message ?? String(error) }
          final.endTime = new Date()
          final.duration = final.endTime.getTime() - (final.startTime as Date).getTime()
          executions.set(final.id, serializeExecution(final))

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'execution-error',
                error: error?.message ?? String(error),
                execution: serializeExecution(final),
              }) + '\n'
            )
          )
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// GET - Get execution status
export async function GET(request: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const execution = executions.get(id)
      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }
      // Verify ownership
      if (execution.workflowId) {
        const { data: workflow } = await supabase
          .from('workflows')
          .select('user_id')
          .eq('id', execution.workflowId)
          .single()
        if (!workflow || workflow.user_id !== user.id) {
          return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
        }
      }
      return NextResponse.json(execution)
    }

    // List executions for this user only
    const allExecutions = Array.from(executions.values())
    const userExecutions = []
    for (const exec of allExecutions) {
      if (exec.workflowId) {
        const { data: workflow } = await supabase
          .from('workflows')
          .select('user_id')
          .eq('id', exec.workflowId)
          .single()
        if (workflow && workflow.user_id === user.id) {
          userExecutions.push(exec)
        }
      }
    }
    return NextResponse.json(userExecutions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Cancel execution
export async function DELETE(request: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      )
    }

    const execution = executions.get(id)
    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (execution.workflowId) {
      const { data: workflow } = await supabase
        .from('workflows')
        .select('user_id')
        .eq('id', execution.workflowId)
        .single()
      if (!workflow || workflow.user_id !== user.id) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
      }
    }

    execution.status = 'cancelled'
    execution.endTime = new Date().toISOString()

    return NextResponse.json({ success: true, execution })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}