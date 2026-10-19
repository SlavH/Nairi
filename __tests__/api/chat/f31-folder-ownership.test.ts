/**
 * F31: conversation folder ownership.
 *
 * Folder reads/updates/deletes must be scoped to the authenticated owner in the
 * query itself (not RLS alone), a non-owner guessing a folder id must not get a
 * success response, and folder_id written onto a conversation must reference a
 * folder the caller owns (AUDIT_CHAT.md: conversations accepted any folder_id).
 */
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH as PATCH_CONVERSATION } from "@/app/api/chat/conversations/[conversationId]/route"
import { POST as POST_CONVERSATION } from "@/app/api/chat/conversations/route"
import { DELETE, PATCH } from "@/app/api/chat/folders/[folderId]/route"
import { GET, POST } from "@/app/api/chat/folders/route"

const OWNER = "00000000-0000-0000-0000-000000000001"
const INTRUDER = "00000000-0000-0000-0000-000000000002"
const FOLDER_ID = "11111111-1111-1111-1111-111111111111"
const OWN_FOLDER_ID = "22222222-2222-2222-2222-222222222222"
const FOREIGN_FOLDER_ID = "33333333-3333-3333-3333-333333333333"
const CONVERSATION_ID = "44444444-4444-4444-4444-444444444444"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth", () => ({ getUserIdForApi: vi.fn() }))

const { createClient } = await import("@/lib/supabase/server")
const { getUserIdForApi } = await import("@/lib/auth")

type Row = Record<string, any>

interface RecordedCall {
  table: string
  op: string
  eq: Array<[string, any]>
  payload: any
}

function makeSupabase(tables: Record<string, Row[]>) {
  const stores: Record<string, { rows: Row[] }> = {}
  for (const [table, rows] of Object.entries(tables)) {
    stores[table] = { rows: rows.map((r) => ({ ...r })) }
  }
  const calls: RecordedCall[] = []

  const matches = (row: Row, eq: Array<[string, any]>) => eq.every(([col, val]) => row[col] === val)

  const from = (table: string) => {
    const store = stores[table]
    if (!store) throw new Error(`Unexpected table: ${table}`)
    const eq: Array<[string, any]> = []
    let op = "select"
    let payload: any = undefined

    const run = (): { data: any; error: null } => {
      calls.push({ table, op, eq: [...eq], payload })
      if (op === "insert") {
        const row: Row = { id: crypto.randomUUID(), ...payload }
        store.rows.push(row)
        return { data: row, error: null }
      }
      const matched = store.rows.filter((r) => matches(r, eq))
      if (op === "update") {
        matched.forEach((r) => Object.assign(r, payload))
        return { data: matched.map((r) => ({ ...r })), error: null }
      }
      if (op === "delete") {
        const removed: Row[] = []
        for (let i = store.rows.length - 1; i >= 0; i--) {
          if (matches(store.rows[i], eq)) removed.unshift(...store.rows.splice(i, 1))
        }
        return { data: removed, error: null }
      }
      return { data: matched.map((r) => ({ ...r })), error: null }
    }

    const node: any = {
      select: () => node,
      insert: (values: any) => {
        op = "insert"
        payload = values
        return node
      },
      update: (values: any) => {
        op = "update"
        payload = values
        return node
      },
      delete: () => {
        op = "delete"
        return node
      },
      eq: (col: string, val: any) => {
        eq.push([col, val])
        return node
      },
      order: () => node,
      limit: () => node,
      single: () => {
        const res = run()
        if (op === "insert") return Promise.resolve(res)
        const rows = res.data as Row[]
        if (rows.length === 0) return Promise.resolve({ data: null, error: { message: "Row not found" } })
        return Promise.resolve({ data: rows[0], error: null })
      },
      maybeSingle: () => {
        const rows = (run().data ?? []) as Row[]
        if (rows.length > 1) return Promise.resolve({ data: null, error: { message: "multiple rows" } })
        return Promise.resolve({ data: rows[0] ?? null, error: null })
      },
      then: (onFulfilled: (v: any) => any, onRejected: (e: unknown) => any) =>
        Promise.resolve(run()).then(onFulfilled, onRejected),
    }
    return node
  }

  return {
    client: { from, auth: { getUser: vi.fn() } },
    stores,
    calls,
    callsFor: (table: string, op?: string) =>
      calls.filter((c) => c.table === table && (op === undefined || c.op === op)),
  }
}

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const folderParams = { params: Promise.resolve({ folderId: FOLDER_ID }) }
const conversationParams = { params: Promise.resolve({ conversationId: CONVERSATION_ID }) }

describe("F31 conversation folder ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/chat/folders", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getUserIdForApi).mockResolvedValue(null)
      vi.mocked(createClient).mockResolvedValue({} as never)

      const res = await GET()
      expect(res.status).toBe(401)
    })

    it("lists only folders whose user_id matches the caller", async () => {
      const supa = makeSupabase({
        conversation_folders: [{ id: FOLDER_ID, user_id: OWNER, name: "Victim folder" }],
      })
      vi.mocked(getUserIdForApi).mockResolvedValue(INTRUDER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.folders).toEqual([])

      const reads = supa.callsFor("conversation_folders", "select")
      expect(reads.length).toBeGreaterThan(0)
      expect(reads[0].eq).toContainEqual(["user_id", INTRUDER])
    })
  })

  describe("POST /api/chat/folders", () => {
    it("creates the folder owned by the caller", async () => {
      const supa = makeSupabase({ conversation_folders: [] })
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await POST(jsonRequest("http://localhost/api/chat/folders", "POST", { name: "Mine" }))
      expect(res.status).toBe(200)
      expect(supa.stores.conversation_folders.rows).toHaveLength(1)
      expect(supa.stores.conversation_folders.rows[0].user_id).toBe(OWNER)
    })
  })

  describe("PATCH /api/chat/folders/[folderId]", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getUserIdForApi).mockResolvedValue(null)
      vi.mocked(createClient).mockResolvedValue({} as never)

      const res = await PATCH(
        jsonRequest(`http://localhost/api/chat/folders/${FOLDER_ID}`, "PATCH", { name: "x" }),
        folderParams
      )
      expect(res.status).toBe(401)
    })

    it("renames a folder the caller owns", async () => {
      const supa = makeSupabase({
        conversation_folders: [{ id: FOLDER_ID, user_id: OWNER, name: "Victim folder" }],
      })
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await PATCH(
        jsonRequest(`http://localhost/api/chat/folders/${FOLDER_ID}`, "PATCH", { name: "Renamed" }),
        folderParams
      )
      expect(res.status).toBe(200)
      expect(supa.stores.conversation_folders.rows[0].name).toBe("Renamed")
    })

    it("does not report success when a non-owner guesses the folder id", async () => {
      const supa = makeSupabase({
        conversation_folders: [{ id: FOLDER_ID, user_id: OWNER, name: "Victim folder" }],
      })
      vi.mocked(getUserIdForApi).mockResolvedValue(INTRUDER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await PATCH(
        jsonRequest(`http://localhost/api/chat/folders/${FOLDER_ID}`, "PATCH", { name: "Hacked" }),
        folderParams
      )
      expect(res.status).toBe(404)
      expect(supa.stores.conversation_folders.rows[0].name).toBe("Victim folder")

      const updates = supa.callsFor("conversation_folders", "update")
      expect(updates).toHaveLength(1)
      expect(updates[0].eq).toContainEqual(["user_id", INTRUDER])
    })
  })

  describe("DELETE /api/chat/folders/[folderId]", () => {
    const req = jsonRequest(`http://localhost/api/chat/folders/${FOLDER_ID}`, "DELETE", null)

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getUserIdForApi).mockResolvedValue(null)
      vi.mocked(createClient).mockResolvedValue({} as never)

      const res = await DELETE(req, folderParams)
      expect(res.status).toBe(401)
    })

    it("deletes a folder the caller owns", async () => {
      const supa = makeSupabase({
        conversation_folders: [{ id: FOLDER_ID, user_id: OWNER, name: "Victim folder" }],
      })
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await DELETE(req, folderParams)
      expect(res.status).toBe(200)
      expect(supa.stores.conversation_folders.rows).toHaveLength(0)
    })

    it("does not report success when a non-owner guesses the folder id", async () => {
      const supa = makeSupabase({
        conversation_folders: [{ id: FOLDER_ID, user_id: OWNER, name: "Victim folder" }],
      })
      vi.mocked(getUserIdForApi).mockResolvedValue(INTRUDER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await DELETE(req, folderParams)
      expect(res.status).toBe(404)
      expect(supa.stores.conversation_folders.rows).toHaveLength(1)

      const deletes = supa.callsFor("conversation_folders", "delete")
      expect(deletes).toHaveLength(1)
      expect(deletes[0].eq).toContainEqual(["user_id", INTRUDER])
    })
  })

  describe("POST /api/chat/conversations folder_id ownership", () => {
    function conversationTables() {
      return {
        conversations: [] as Row[],
        conversation_folders: [
          { id: OWN_FOLDER_ID, user_id: OWNER, name: "Mine" },
          { id: FOREIGN_FOLDER_ID, user_id: INTRUDER, name: "Victim folder" },
        ],
      }
    }

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getUserIdForApi).mockResolvedValue(null)
      vi.mocked(createClient).mockResolvedValue({} as never)

      const res = await POST_CONVERSATION(
        jsonRequest("http://localhost/api/chat/conversations", "POST", { folder_id: FOREIGN_FOLDER_ID })
      )
      expect(res.status).toBe(401)
    })

    it("rejects a folder owned by another user and creates nothing", async () => {
      const supa = makeSupabase(conversationTables())
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await POST_CONVERSATION(
        jsonRequest("http://localhost/api/chat/conversations", "POST", { folder_id: FOREIGN_FOLDER_ID })
      )
      expect(res.status).toBe(400)
      expect(supa.stores.conversations.rows).toHaveLength(0)
      expect(supa.callsFor("conversation_folders", "select").length).toBeGreaterThan(0)
    })

    it("accepts a folder owned by the caller", async () => {
      const supa = makeSupabase(conversationTables())
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await POST_CONVERSATION(
        jsonRequest("http://localhost/api/chat/conversations", "POST", { folder_id: OWN_FOLDER_ID })
      )
      expect(res.status).toBe(200)
      expect(supa.stores.conversations.rows).toHaveLength(1)
      expect(supa.stores.conversations.rows[0].folder_id).toBe(OWN_FOLDER_ID)
      expect(supa.stores.conversations.rows[0].user_id).toBe(OWNER)
    })

    it("still creates a conversation without a folder", async () => {
      const supa = makeSupabase(conversationTables())
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await POST_CONVERSATION(
        jsonRequest("http://localhost/api/chat/conversations", "POST", {})
      )
      expect(res.status).toBe(200)
      expect(supa.stores.conversations.rows).toHaveLength(1)
      expect(supa.stores.conversations.rows[0].folder_id).toBeUndefined()
    })
  })

  describe("PATCH /api/chat/conversations/[conversationId] folder_id ownership", () => {
    function conversationTables() {
      return {
        conversations: [
          {
            id: CONVERSATION_ID,
            user_id: OWNER,
            title: "Mine",
            folder_id: null as string | null,
          },
        ],
        conversation_folders: [
          { id: OWN_FOLDER_ID, user_id: OWNER, name: "Mine" },
          { id: FOREIGN_FOLDER_ID, user_id: INTRUDER, name: "Victim folder" },
        ],
      }
    }

    it("rejects moving a conversation into another user's folder", async () => {
      const supa = makeSupabase(conversationTables())
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await PATCH_CONVERSATION(
        jsonRequest(
          `http://localhost/api/chat/conversations/${CONVERSATION_ID}`,
          "PATCH",
          { folder_id: FOREIGN_FOLDER_ID }
        ),
        conversationParams
      )
      expect(res.status).toBe(400)
      expect(supa.stores.conversations.rows[0].folder_id).toBeNull()
      expect(supa.callsFor("conversations", "update")).toHaveLength(0)
    })

    it("moves a conversation into a folder the caller owns", async () => {
      const supa = makeSupabase(conversationTables())
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await PATCH_CONVERSATION(
        jsonRequest(
          `http://localhost/api/chat/conversations/${CONVERSATION_ID}`,
          "PATCH",
          { folder_id: OWN_FOLDER_ID }
        ),
        conversationParams
      )
      expect(res.status).toBe(200)
      expect(supa.stores.conversations.rows[0].folder_id).toBe(OWN_FOLDER_ID)
    })

    it("clears the folder when folder_id is null", async () => {
      const supa = makeSupabase(conversationTables())
      supa.stores.conversations.rows[0].folder_id = OWN_FOLDER_ID
      vi.mocked(getUserIdForApi).mockResolvedValue(OWNER)
      vi.mocked(createClient).mockResolvedValue(supa.client as never)

      const res = await PATCH_CONVERSATION(
        jsonRequest(
          `http://localhost/api/chat/conversations/${CONVERSATION_ID}`,
          "PATCH",
          { folder_id: null }
        ),
        conversationParams
      )
      expect(res.status).toBe(200)
      expect(supa.stores.conversations.rows[0].folder_id).toBeNull()
    })
  })
})
