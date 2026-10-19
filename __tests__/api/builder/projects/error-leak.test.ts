import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  GET as getProject,
  PATCH as patchProject,
  DELETE as deleteProject,
} from "@/app/api/builder/projects/[id]/route"
import { GET as listProjects, POST as createProject } from "@/app/api/builder/projects/route"

const userId = "00000000-0000-0000-0000-000000000001"
const projectId = "11111111-1111-1111-1111-111111111111"
const DB_SECRET =
  'permission denied for table builder_projects: role "app_user_secret" does not exist'

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 9,
    resetTime: Date.now() + 60000,
    retryAfter: 0,
  })),
  getClientIdentifier: vi.fn(() => "test-client"),
}))
vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

type DbResult = { data?: unknown; error?: unknown }

function chain(result: DbResult) {
  const c: any = {
    select: () => c,
    insert: () => c,
    update: () => c,
    delete: () => c,
    eq: () => c,
    order: () => c,
    single: () => c,
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }
  return c
}

function dbClient(result: DbResult) {
  return { from: vi.fn(() => chain(result)) } as any
}

function clientRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${path}`, init)
}

function params() {
  return { params: Promise.resolve({ id: projectId }) }
}

describe("builder projects routes (F35 internal error leak)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
    vi.mocked(createClient).mockResolvedValue(dbClient({ data: [], error: null }))
  })

  it("GET /api/builder/projects does not leak the database error message", async () => {
    vi.mocked(createClient).mockResolvedValue(dbClient({ data: null, error: { message: DB_SECRET } }))

    const res = await listProjects(clientRequest("/api/builder/projects"))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain(DB_SECRET)
    expect(JSON.stringify(body)).not.toContain("app_user_secret")
    expect(body.error).toBe("Internal server error")
  })

  it("POST /api/builder/projects does not leak the database error message", async () => {
    vi.mocked(createClient).mockResolvedValue(dbClient({ data: null, error: { message: DB_SECRET } }))

    const res = await createProject(
      clientRequest("/api/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Project", files: [] }),
      })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain(DB_SECRET)
    expect(body.error).toBe("Internal server error")
  })

  it("GET /api/builder/projects/[id] does not leak the database error message", async () => {
    vi.mocked(createClient).mockResolvedValue(
      dbClient({ data: null, error: { code: "XX000", message: DB_SECRET } })
    )

    const res = await getProject(clientRequest(`/api/builder/projects/${projectId}`), params())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain(DB_SECRET)
    expect(body.error).toBe("Internal server error")
  })

  it("GET /api/builder/projects/[id] keeps returning 404 for missing projects", async () => {
    vi.mocked(createClient).mockResolvedValue(
      dbClient({ data: null, error: { code: "PGRST116", message: "not found" } })
    )

    const res = await getProject(clientRequest(`/api/builder/projects/${projectId}`), params())

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe("Project not found")
  })

  it("PATCH /api/builder/projects/[id] does not leak the database error message", async () => {
    vi.mocked(createClient).mockResolvedValue(
      dbClient({ data: null, error: { code: "42501", message: DB_SECRET } })
    )

    const res = await patchProject(
      clientRequest(`/api/builder/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Renamed" }),
      }),
      params()
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain(DB_SECRET)
    expect(body.error).toBe("Internal server error")
  })

  it("DELETE /api/builder/projects/[id] does not leak the database error message", async () => {
    vi.mocked(createClient).mockResolvedValue(
      dbClient({ data: null, error: { code: "42501", message: DB_SECRET } })
    )

    const res = await deleteProject(
      clientRequest(`/api/builder/projects/${projectId}`, { method: "DELETE" }),
      params()
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain(DB_SECRET)
    expect(body.error).toBe("Internal server error")
  })
})
