import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET, POST } from "@/app/api/builder/projects/route"
import { PATCH } from "@/app/api/builder/projects/[id]/route"

const userId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))
vi.mock("@/lib/security/request-validator", () => ({
  assertSameOrigin: vi.fn(() => null),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

function post(body: unknown) {
  return new NextRequest("http://localhost/api/builder/projects", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("builder projects size limits (F17)", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("rejects create when total files exceed 500KB", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    } as any)
    // Each file is under the 100KB per-file cap; the sum breaches 500KB.
    const files = Array.from({ length: 6 }, (_, i) => ({
      name: `f${i}.txt`, path: `f${i}.txt`, content: "x".repeat(90 * 1024),
    }))
    const res = await POST(post({ name: "big", files }))
    expect(res.status).toBe(413)
  })

  it("rejects create with more than 50 files", async () => {
    const files = Array.from({ length: 51 }, (_, i) => ({
      name: `f${i}`, path: `f${i}.txt`, content: "ok",
    }))
    const res = await POST(post({ name: "many", files }))
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toContain("Validation failed")
  })
})

describe("PATCH /api/builder/projects/[id] version churn (F17)", () => {
  const projectId = "11111111-1111-1111-1111-111111111111"

  function patch(body: unknown) {
    return new Request(`http://localhost/api/builder/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }

  function makeChainable(current: { versions: unknown[]; files: unknown }) {
    return {
      from: (table: string) => {
        expect(table).toBe("builder_projects")
        let updatedPayload: Record<string, unknown> | null = null
        const chain = {
          select: () => chain,
          eq: () => chain,
          single: () => {
            // First .single() is the versions+files fetch, later ones are update results.
            if (updatedPayload === null) {
              return Promise.resolve({ data: current, error: null })
            }
            return Promise.resolve({
              data: { id: projectId, ...current, ...updatedPayload },
              error: null,
            })
          },
          update: (payload: Record<string, unknown>) => {
            updatedPayload = payload
            return chain
          },
        }
        return chain
      },
    }
  }

  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("does not append a version snapshot when files are unchanged", async () => {
    const files = [{ name: "a.ts", path: "a.ts", content: "export {}" }]
    const existingVersions = [
      { id: "v1", name: "Save 1", description: "", files, createdAt: "2026-01-01T00:00:00Z" },
    ]
    vi.mocked(createClient).mockResolvedValue(makeChainable({ versions: existingVersions, files }) as any)

    const res = await PATCH(patch({ files }), { params: Promise.resolve({ id: projectId }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.versions).toHaveLength(1)
  })

  it("appends exactly one snapshot when files changed", async () => {
    const oldFiles = [{ name: "a.ts", path: "a.ts", content: "old" }]
    const newFiles = [{ name: "a.ts", path: "a.ts", content: "new" }]
    vi.mocked(createClient).mockResolvedValue(
      makeChainable({ versions: [], files: oldFiles }) as any
    )

    const res = await PATCH(patch({ files: newFiles }), { params: Promise.resolve({ id: projectId }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.versions).toHaveLength(1)
    expect(data.files).toEqual(newFiles)
  })

  it("rejects payloads over the 500KB budget on update", async () => {
    vi.mocked(createClient).mockResolvedValue(makeChainable({ versions: [], files: null }) as any)
    const files = Array.from({ length: 6 }, (_, i) => ({
      name: `f${i}.txt`, path: `f${i}.txt`, content: "x".repeat(90 * 1024),
    }))
    const res = await PATCH(patch({ files }), { params: Promise.resolve({ id: projectId }) })
    expect(res.status).toBe(413)
  })
})
