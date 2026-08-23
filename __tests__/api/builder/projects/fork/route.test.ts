import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST } from "@/app/api/builder/projects/[id]/fork/route"

const userId = "00000000-0000-0000-0000-000000000001"
const projectId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9, resetTime: 0, retryAfter: 0 })),
  getClientIdentifier: vi.fn(() => "test-client"),
  RATE_LIMITS: { create: { maxRequests: 10, windowMs: 60000 } },
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")
const { checkRateLimit } = await import("@/lib/rate-limit")

type Result = { data: unknown; error: unknown }

function makeClient(opts: {
  projectResult?: Result
  collaboratorResult?: Result
  forkedProjectResult?: Result
  forkRecordError?: unknown
}) {
  const from = vi.fn((table: string) => {
    if (table === "builder_projects") {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve(opts.projectResult ?? { data: null, error: { message: "not found" } }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve(
                opts.forkedProjectResult ?? { data: null, error: { message: "insert failed" } }
              ),
          }),
        }),
      }
    }
    if (table === "builder_project_collaborators") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve(opts.collaboratorResult ?? { data: null, error: null }),
            }),
          }),
        }),
      }
    }
    if (table === "builder_project_forks") {
      const error = opts.forkRecordError ?? null
      return {
        insert: () => ({
          then: (onFulfilled: (v: Result) => unknown, onRejected: (e: unknown) => unknown) =>
            Promise.resolve({ data: null, error }).then(onFulfilled, onRejected),
        }),
      }
    }
    throw new Error("unexpected table: " + table)
  })
  return { client: { from } as any, from }
}

function post() {
  return new NextRequest(`http://localhost/api/builder/projects/${projectId}/fork`, {
    method: "POST",
  })
}

const context = { params: { id: projectId } }

describe("POST /api/builder/projects/[id]/fork (F16)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
    vi.mocked(checkRateLimit as any).mockClear?.()
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    vi.mocked(createClient).mockResolvedValue(makeClient({}) as any)
    const res = await POST(post(), context)
    expect(res.status).toBe(401)
  })

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    } as any)
    vi.mocked(createClient).mockResolvedValue(makeClient({}) as any)
    const res = await POST(post(), context)
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("60")
  })

  it("denies a private project to a non-collaborator", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({
        projectResult: { data: { id: projectId, is_public: false, user_id: "other" }, error: null },
        collaboratorResult: { data: null, error: null },
      }) as any
    )
    const res = await POST(post(), context)
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toContain("not accessible")
  })

  it("creates the fork and records the fork row for a public project", async () => {
    const forked = { id: "22222222-2222-2222-2222-222222222222", name: "Fork" }
    const { client, from } = makeClient({
      projectResult: { data: { id: projectId, is_public: true, user_id: "other", name: "Orig", files: {} }, error: null },
      forkedProjectResult: { data: forked, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const res = await POST(post(), context)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.project).toEqual(forked)
    expect(data.originalProjectId).toBe(projectId)

    // Fork relationship must be recorded via builder_project_forks.
    const tables = from.mock.calls.map((args) => args[0])
    expect(tables).toContain("builder_project_forks")
  })

  it("fails when recording the fork relationship errors", async () => {
    const { client } = makeClient({
      projectResult: { data: { id: projectId, is_public: true, user_id: "other", name: "Orig", files: {} }, error: null },
      forkedProjectResult: {
        data: { id: "22222222-2222-2222-2222-222222222222", name: "Fork" },
        error: null,
      },
      forkRecordError: { message: "rls denied" },
    })
    vi.mocked(createClient).mockResolvedValue(client as any)

    const res = await POST(post(), context)
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
