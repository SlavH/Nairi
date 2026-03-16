import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/builder/projects/route"

const mockUserId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getUserIdOrBypassForApi: vi.fn(),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdOrBypassForApi } = await import("@/lib/auth")

describe("GET /api/builder/projects", () => {
  beforeEach(() => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(null)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 200 and array when authenticated and no projects", async () => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(mockUserId)
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => mockSelect(),
          }),
        }),
      }),
    } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(0)
  })
})

describe("POST /api/builder/projects", () => {
  beforeEach(() => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(null)
  })

  it("returns 401 when not authenticated", async () => {
    const res = await POST(
      new Request("http://localhost/api/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", files: [] }),
      })
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid JSON", async () => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(mockUserId)
    vi.mocked(createClient).mockResolvedValue({} as any)
    const res = await POST(
      new Request("http://localhost/api/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      })
    )
    expect(res.status).toBe(400)
  })

  it("returns 200 and project when authenticated with valid body", async () => {
    vi.mocked(getUserIdOrBypassForApi).mockResolvedValue(mockUserId)
    const inserted = {
      id: "proj-123",
      name: "My Project",
      files: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: inserted, error: null }),
          }),
        }),
      }),
    } as any)
    const res = await POST(
      new Request("http://localhost/api/builder/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Project", files: [] }),
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(inserted.id)
    expect(data.name).toBe(inserted.name)
  })
})
