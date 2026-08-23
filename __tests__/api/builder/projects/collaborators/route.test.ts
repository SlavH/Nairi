import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET, POST } from "@/app/api/builder/projects/[id]/collaborators/route"

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

type Result = { data: unknown; error: unknown }

function makeClient(opts: {
  projectResult?: Result
  collaboratorsResult?: Result
  insertCollaborator?: Result
}) {
  const collaboratorSelectArgs: unknown[] = []
  const from = vi.fn((table: string) => {
    if (table === "builder_projects") {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve(opts.projectResult ?? { data: null, error: { message: "nf" } }),
          }),
        }),
      }
    }
    if (table === "builder_project_collaborators") {
      return {
        select: (...args: unknown[]) => {
          collaboratorSelectArgs.push(args[0])
          return {
            eq: () => Promise.resolve(opts.collaboratorsResult ?? { data: [], error: null }),
          }
        },
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve(
                opts.insertCollaborator ?? { data: null, error: { message: "insert failed" } }
              ),
          }),
        }),
      }
    }
    throw new Error("unexpected table: " + table)
  })
  return { client: { from } as any, from, collaboratorSelectArgs }
}

const context = { params: { id: projectId } }

describe("/api/builder/projects/[id]/collaborators (F16)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getUserIdForApi).mockResolvedValue(null)
      vi.mocked(createClient).mockResolvedValue(makeClient({}).client as any)
      const req = new NextRequest(`http://localhost/api/builder/projects/${projectId}/collaborators`)
      const res = await GET(req, context)
      expect(res.status).toBe(401)
    })

    it("must not request or disclose collaborator emails", async () => {
      const { client, from, collaboratorSelectArgs } = makeClient({
        projectResult: { data: { user_id: userId, is_public: false }, error: null },
        collaboratorsResult: {
          data: [{ id: "c1", role: "editor", profiles: { id: "u2", full_name: "Bob" } }],
          error: null,
        },
      })
      vi.mocked(createClient).mockResolvedValue(client as any)

      const req = new NextRequest(`http://localhost/api/builder/projects/${projectId}/collaborators`)
      const res = await GET(req, context)
      expect(res.status).toBe(200)

      // The embed must not ask for the email column at all.
      expect(collaboratorSelectArgs.length).toBeGreaterThan(0)
      for (const arg of collaboratorSelectArgs) {
        expect(String(arg)).not.toContain("email")
      }

      const data = await res.json()
      expect(data.collaborators[0].profiles).not.toHaveProperty("email")
      expect(data.collaborators[0].profiles.full_name).toBe("Bob")

      // The queried tables are recorded on the from() mock.
      const tables = from.mock.calls.map((args) => args[0])
      expect(tables).toContain("builder_project_collaborators")
    })
  })

  describe("POST", () => {
    it("returns 403 for non-owner", async () => {
      vi.mocked(createClient).mockResolvedValue(
        makeClient({ projectResult: { data: { user_id: "someone-else" }, error: null } }).client as any
      )
      const req = new NextRequest(`http://localhost/api/builder/projects/${projectId}/collaborators`, {
        method: "POST",
        body: JSON.stringify({ userId: "33333333-3333-3333-3333-333333333333", role: "editor" }),
      })
      const res = await POST(req, context)
      expect(res.status).toBe(403)
    })

    it("rejects the reserved owner role", async () => {
      vi.mocked(createClient).mockResolvedValue(
        makeClient({ projectResult: { data: { user_id: userId }, error: null } }).client as any
      )
      const req = new NextRequest(`http://localhost/api/builder/projects/${projectId}/collaborators`, {
        method: "POST",
        body: JSON.stringify({ userId: "33333333-3333-3333-3333-333333333333", role: "owner" }),
      })
      const res = await POST(req, context)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(JSON.stringify(data)).toContain("Invalid request")
    })

    it("adds an editor successfully", async () => {
      const inserted = { id: "c1", role: "editor" }
      vi.mocked(createClient).mockResolvedValue(
        makeClient({
          projectResult: { data: { user_id: userId }, error: null },
          insertCollaborator: { data: inserted, error: null },
        }).client as any
      )
      const req = new NextRequest(`http://localhost/api/builder/projects/${projectId}/collaborators`, {
        method: "POST",
        body: JSON.stringify({ userId: "33333333-3333-3333-3333-333333333333", role: "editor" }),
      })
      const res = await POST(req, context)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.collaborator.role).toBe("editor")
    })
  })
})
