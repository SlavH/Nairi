import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { POST as createPost, GET as getFeed } from "@/app/api/flow/route"
import { GET as getComments, POST as postComment } from "@/app/api/flow/[postId]/comments/route"
import { POST as toggleFollow } from "@/app/api/flow/follow/route"

const userId = "00000000-0000-0000-0000-000000000001"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getUserIdForApi: vi.fn(),
}))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

type Row = Record<string, unknown>

/**
 * Minimal chainable Supabase mock covering the exact call shapes used by the
 * flow routes: select().eq().single(), select().eq().in(), select().order().range(),
 * insert().select().single(), insert() and delete().eq().
 */
function makeSupabase(overrides: { posts?: Row[]; comments?: Row[]; likes?: Row[]; following?: Row[] } = {}) {
  const posts = overrides.posts || []
  const prof = { id: "t", full_name: "Target", avatar_url: null }

  const feedSelect = () => ({
    eq: () => ({
      single: () => Promise.resolve({ data: { id: "p1" }, error: null }),
    }),
    order: () => ({
      range: () => Promise.resolve({ data: posts, error: null, count: posts.length }),
    }),
  })

  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: userId } } }) },
    from: (table: string) => {
      switch (table) {
        case "user_follows": {
          const follows = overrides.following || []
          // Chain node: awaitable AND supports further .eq()/.maybeSingle()
          const chainNode = () => {
            const node: Record<string, unknown> = {
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
              single: () => Promise.resolve({ data: null, error: null }),
              then: (
                resolve: (v: { data: Row[]; error: null }) => void,
                reject?: (e: unknown) => void
              ) => Promise.resolve({ data: follows, error: null }).then(resolve, reject),
            }
            node.eq = () => chainNode()
            return node
          }
          return {
            select: () => ({
              eq: () => chainNode(),
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
            delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          }
        }
        case "feed_posts":
          return {
            select: feedSelect,
            insert: () => ({
              select: () => ({ single: () => Promise.resolve({ data: { id: "new-post" }, error: null }) }),
            }),
            delete: () => ({ eq: (_c: string, _v: unknown) => Promise.resolve({ count: 1, error: null }) }),
          }
        case "post_likes": {
          const likes = overrides.likes || []
          return {
            select: () => ({
              eq: () => ({
                in: () => Promise.resolve({ data: likes, error: null }),
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        case "profiles":
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: prof, error: null }),
                maybeSingle: () => Promise.resolve({ data: prof, error: null }),
              }),
            }),
          }
        case "post_comments":
          return {
            select: () => ({
              eq: () => ({
                order: () => ({ limit: () => Promise.resolve({ data: overrides.comments || [], error: null }) }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: "c1", content: "nice", created_at: new Date().toISOString() },
                    error: null,
                  }),
              }),
            }),
          }
        default:
          return {}
      }
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>
}

function jsonReq(url: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("POST /api/flow", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("creates a post with valid payload", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await createPost(jsonReq("/api/flow", "POST", { content: "hello world" }))
    expect(res.status).toBe(201)
    expect((await res.json()).postId).toBe("new-post")
  })

  it("rejects empty content", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await createPost(jsonReq("/api/flow", "POST", { content: "   " }))
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await createPost(jsonReq("/api/flow", "POST", { content: "x" }))
    expect(res.status).toBe(401)
  })
})

describe("GET /api/flow feed", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("returns items with normalized fields", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        posts: [
          {
            id: "p1",
            user_id: userId,
            content: "my art",
            media_url: "https://example.com/x.png",
            media_type: null,
            visibility: "public",
            likes_count: 3,
            comments_count: 1,
            shares_count: 0,
            created_at: new Date().toISOString(),
            tags: ["ai"],
            profiles: { id: userId, full_name: "Me", avatar_url: null },
          },
        ],
      })
    )
    const res = await getFeed(new NextRequest("http://localhost/api/flow?page=1"))
    const json = await res.json()
    expect(json.items).toHaveLength(1)
    expect(json.items[0].media_type).toBe("image")
    expect(json.items[0].is_own).toBe(true)
  })

  it("marks liked posts from post_likes lookup", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        posts: [
          {
            id: "p9", user_id: "u2", content: "hi", media_url: null, media_type: null,
            visibility: "public", likes_count: 0, comments_count: 0, shares_count: 0,
            created_at: new Date().toISOString(), tags: [],
            profiles: { full_name: "A", avatar_url: null },
          },
        ],
        likes: [{ post_id: "p9" }],
      })
    )
    const res = await getFeed(new NextRequest("http://localhost/api/flow?page=1"))
    const json = await res.json()
    expect(json.items[0].is_liked).toBe(true)
  })
})

describe("/api/flow/[postId]/comments", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("lists and creates comments", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        comments: [
          { id: "c0", content: "first", created_at: new Date().toISOString(), user_id: "u2", profiles: { full_name: "A", avatar_url: null } },
        ],
      })
    )

    const listRes = await getComments(new NextRequest("http://localhost/api/flow/p1/comments"), {
      params: Promise.resolve({ postId: "p1" }),
    })
    expect(((await listRes.json()).comments)).toHaveLength(1)

    const postRes = await postComment(
      jsonReq("/api/flow/p1/comments", "POST", { content: "nice" }),
      { params: Promise.resolve({ postId: "p1" }) }
    )
    expect(postRes.status).toBe(201)
  })

  it("rejects over-long comments", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await postComment(
      jsonReq("/api/flow/p1/comments", "POST", { content: "x".repeat(1001) }),
      { params: Promise.resolve({ postId: "p1" }) }
    )
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it("requires auth to comment", async () => {
    vi.mocked(getUserIdForApi).mockResolvedValue(null)
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await postComment(
      jsonReq("/api/flow/p1/comments", "POST", { content: "anon" }),
      { params: Promise.resolve({ postId: "p1" }) }
    )
    expect(res.status).toBe(401)
  })
})

describe("POST /api/flow/follow", () => {
  beforeEach(() => {
    vi.mocked(getUserIdForApi).mockResolvedValue(userId)
  })

  it("follows a user", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await toggleFollow(
      jsonReq("/api/flow/follow", "POST", { userId: "00000000-0000-0000-0000-000000000009" })
    )
    expect((await res.json()).following).toBe(true)
  })

  it("rejects self-follow", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await toggleFollow(jsonReq("/api/flow/follow", "POST", { userId }))
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it("validates payload shape", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase())
    const res = await toggleFollow(jsonReq("/api/flow/follow", "POST", { userId: "not-a-uuid" }))
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
