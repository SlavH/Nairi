import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { makeSupabaseClient, setMockUser } from "@/__tests__/utils/mock-supabase"

const USER_ID = "00000000-0000-0000-0000-000000000001"
const WORKFLOW_ID = "wf-1"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/workflows/executor", () => ({
  WorkflowExecutor: vi.fn(),
}))

const { createClient } = await import("@/lib/supabase/server")
const { WorkflowExecutor } = await import("@/lib/workflows/executor")

import { POST } from "@/app/api/workflows/execute/route"

const WORKFLOW = {
  id: WORKFLOW_ID,
  user_id: USER_ID,
  name: "Test Flow",
  version: 1,
  nodes: [],
  edges: [],
  variables: [],
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/workflows/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function setup(opts: {
  user?: any
  workflow?: any
  workflowError?: any
  balance?: number
} = {}) {
  const client = makeSupabaseClient({
    workflows: {
      singleQueue: [
        { data: opts.workflow ?? null, error: opts.workflowError ?? null },
      ],
    },
    profiles: {
      singleQueue: [{ data: { tokens_balance: opts.balance ?? 0 }, error: null }],
    },
  })
  setMockUser(client, opts.user === undefined ? { id: USER_ID, email: "u@example.com" } : opts.user)
  vi.mocked(createClient).mockResolvedValue(client.client)
  return client
}

function mockExecutor() {
  const executor = {
    execution: {
      id: "exec-1",
      workflowId: WORKFLOW_ID,
      workflowVersion: 1,
      status: "pending" as string,
      triggeredBy: "manual",
      startTime: new Date(),
      nodeResults: [],
      logs: [],
      variables: {},
    },
    on: vi.fn(),
    execute: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(WorkflowExecutor).mockImplementation(function (this: any, workflow: any, triggerData: any) {
    this.execution = executor.execution
    this.on = executor.on
    this.execute = executor.execute
    this.workflow = workflow
    this.triggerData = triggerData
  })
  return executor
}

describe("POST /api/workflows/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns 401 when not authenticated", async () => {
    setup({ user: null })
    const res = await POST(makeRequest({ workflowId: WORKFLOW_ID }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })

  it("returns 400 when workflowId is missing", async () => {
    setup()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "workflowId is required" })
  })

  it("returns 404 when the workflow is not found or owned by someone else", async () => {
    setup({ workflow: null, workflowError: { message: "not found" } })
    const res = await POST(makeRequest({ workflowId: "nope" }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Workflow not found" })
  })

  it("returns 403 when workflow execution is disabled", async () => {
    vi.stubEnv("NAIRI_ENABLE_WORKFLOW_EXEC", "")
    setup({ workflow: WORKFLOW })
    const res = await POST(makeRequest({ workflowId: WORKFLOW_ID }))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Workflow execution is disabled" })
  })

  it("returns 402 with required/available when the user lacks credits", async () => {
    vi.stubEnv("NAIRI_ENABLE_WORKFLOW_EXEC", "true")
    setup({ workflow: WORKFLOW, balance: 3 })
    const res = await POST(makeRequest({ workflowId: WORKFLOW_ID }))
    expect(res.status).toBe(402)
    expect(await res.json()).toEqual({
      error: "Insufficient credits",
      required: 5,
      available: 3,
    })
  })

  it("returns 402 with available 0 for a profile with no balance row", async () => {
    vi.stubEnv("NAIRI_ENABLE_WORKFLOW_EXEC", "true")
    setup({ workflow: WORKFLOW, balance: 0 })
    const res = await POST(makeRequest({ workflowId: WORKFLOW_ID }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.required).toBe(5)
    expect(body.available).toBe(0)
  })

  it("proceeds to execution for a user with sufficient credits", async () => {
    vi.stubEnv("NAIRI_ENABLE_WORKFLOW_EXEC", "true")
    setup({ workflow: WORKFLOW, balance: 100 })
    const executor = mockExecutor()

    const res = await POST(
      makeRequest({ workflowId: WORKFLOW_ID, triggerData: { topic: "hello" } })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("text/event-stream")

    // Consuming the body triggers the stream's start handler
    await res.text()

    expect(WorkflowExecutor).toHaveBeenCalledTimes(1)
    const instance = vi.mocked(WorkflowExecutor).mock.instances[0] as any
    expect(instance.workflow).toEqual(WORKFLOW)
    expect(instance.triggerData).toEqual({ topic: "hello" })
    expect(executor.execute).toHaveBeenCalledTimes(1)
    expect(executor.on).toHaveBeenCalled()
  })

  it("emits execution-start and execution-complete frames on success", async () => {
    vi.stubEnv("NAIRI_ENABLE_WORKFLOW_EXEC", "true")
    setup({ workflow: WORKFLOW, balance: 100 })
    mockExecutor()

    const res = await POST(makeRequest({ workflowId: WORKFLOW_ID }))
    const text = await res.text()
    expect(text).toContain('"type":"execution-start"')
    expect(text).toContain('"type":"execution-complete"')
    expect(text).toContain('"execution"')
  })
})
