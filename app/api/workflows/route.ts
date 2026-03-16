/**
 * Nairi AI Workflow Builder - Workflows API
 * CRUD operations for workflows
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory storage (replace with database in production)
const workflows = new Map<string, any>()

// GET - List all workflows or get a specific workflow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const workflow = workflows.get(id)
      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(workflow)
    }

    // Return all workflows
    const allWorkflows = Array.from(workflows.values())
    return NextResponse.json(allWorkflows)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name || 'Untitled Workflow',
      description: body.description || '',
      version: '1.0.0',
      status: 'draft',
      nodes: body.nodes || [],
      edges: body.edges || [],
      variables: body.variables || [],
      settings: body.settings || {
        timeout: 300000,
        retryCount: 3,
        retryDelay: 1000,
        concurrencyLimit: 10,
        errorHandling: 'stop',
        logging: 'normal',
        sandbox: true,
      },
      triggers: body.triggers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }

    workflows.set(workflow.id, workflow)

    return NextResponse.json(workflow, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update a workflow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    const workflow = workflows.get(id)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    workflows.set(id, updatedWorkflow)

    return NextResponse.json(updatedWorkflow)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a workflow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    if (!workflows.has(id)) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    workflows.delete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
