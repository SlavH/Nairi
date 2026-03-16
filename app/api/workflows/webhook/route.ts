/**
 * Nairi AI Workflow Builder - Webhook Handler API
 * Handle incoming webhooks and trigger workflows
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory webhook registry
const webhooks = new Map<string, any>()

// Register a webhook
export function registerWebhook(config: {
  id: string
  workflowId: string
  nodeId: string
  path: string
  method: string
  authentication?: any
}) {
  webhooks.set(config.path, config)
}

// Handle all HTTP methods
async function handleWebhook(request: NextRequest, method: string) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/workflows/webhook', '')

    // Find matching webhook
    const webhook = webhooks.get(path)

    if (!webhook) {
      // Check for dynamic paths
      for (const [registeredPath, config] of webhooks.entries()) {
        if (matchPath(registeredPath, path)) {
          return await triggerWorkflow(request, config, method)
        }
      }

      return NextResponse.json(
        { error: 'Webhook not found', path },
        { status: 404 }
      )
    }

    // Check method
    if (webhook.method !== method && webhook.method !== 'ANY') {
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { status: 405 }
      )
    }

    return await triggerWorkflow(request, webhook, method)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function triggerWorkflow(request: NextRequest, webhook: any, method: string) {
  // Parse request body
  let body = null
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.json()
    } catch {
      try {
        body = await request.text()
      } catch {
        body = null
      }
    }
  }

  // Parse query parameters
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams.entries())

  // Parse headers
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Create trigger data
  const triggerData = {
    method,
    path: url.pathname,
    query,
    headers,
    body,
    timestamp: new Date().toISOString(),
    webhookId: webhook.id,
    workflowId: webhook.workflowId,
    nodeId: webhook.nodeId,
  }

  // Log webhook trigger
  console.log('Webhook triggered:', {
    path: url.pathname,
    method,
    workflowId: webhook.workflowId,
  })

  // In a real implementation, this would trigger the workflow execution
  // For now, return success with trigger data
  return NextResponse.json({
    success: true,
    message: 'Webhook received',
    executionId: `exec-${Date.now()}`,
    triggerData,
  })
}

function matchPath(pattern: string, path: string): boolean {
  // Simple path matching with :param support
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (patternParts.length !== pathParts.length) {
    return false
  }

  return patternParts.every((part, i) => {
    if (part.startsWith(':')) return true
    return part === pathParts[i]
  })
}

// HTTP method handlers
export async function GET(request: NextRequest) {
  return handleWebhook(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleWebhook(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return handleWebhook(request, 'PUT')
}

export async function DELETE(request: NextRequest) {
  return handleWebhook(request, 'DELETE')
}

export async function PATCH(request: NextRequest) {
  return handleWebhook(request, 'PATCH')
}
