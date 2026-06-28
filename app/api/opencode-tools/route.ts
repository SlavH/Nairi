/**
 * POST /api/opencode-tools — expose OpenCode tools to Nairi
 * Uses the same OPENCODE_API_URL as the chat backend
 * All file operations are scoped to the authenticated user's workspace.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserIdForApi } from "@/lib/auth"
import { WorkspaceManager } from "@/lib/workspace/manager"

const OPENCODE_API_URL = process.env.OPENCODE_API_URL || "https://solidary-baroquely-leola.ngrok-free.dev"
const OPENCODE_TIMEOUT = 120_000

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  return getUserIdForApi(() => supabase.auth.getUser())
}

function scopePath(path: string, userId: string | null): string {
  if (!userId) return path
  const wsPath = WorkspaceManager.getWorkspacePath(userId)
  return path.startsWith("/") ? path : `${wsPath}/${path}`
}

// GET /api/opencode-tools?action=search&q=<query>
// Search files in the project
export async function GET(req: NextRequest) {
  const userId = await getUserId()
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const sessionId = searchParams.get("sessionId")

  try {
    if (action === "search") {
      const pattern = searchParams.get("pattern") || ""
      const scopedPattern = scopePath(pattern, userId)
      const res = await fetch(
        `${OPENCODE_API_URL}/find?pattern=${encodeURIComponent(scopedPattern)}`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "Search failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "find-file") {
      const query = searchParams.get("query") || ""
      const res = await fetch(
        `${OPENCODE_API_URL}/find/file?query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "File search failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "read-file") {
      const path = searchParams.get("path") || ""
      const scopedPath = scopePath(path, userId)
      const res = await fetch(
        `${OPENCODE_API_URL}/file?path=${encodeURIComponent(scopedPath)}`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "File read failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "list-files") {
      const path = searchParams.get("path") || ""
      const scopedPath = scopePath(path, userId)
      const res = await fetch(
        `${OPENCODE_API_URL}/file?path=${encodeURIComponent(scopedPath)}`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "List failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "session-status") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}/status`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "Status check failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "list-sessions") {
      const res = await fetch(
        `${OPENCODE_API_URL}/session`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "List sessions failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "project-info") {
      const res = await fetch(
        `${OPENCODE_API_URL}/project/current`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "Project info failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/opencode-tools — execute commands via OpenCode
export async function POST(req: NextRequest) {
  const userId = await getUserId()
  try {
    const body = await req.json()
    const { action, sessionId } = body

    if (action === "init-project") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const workspacePath = userId ? await WorkspaceManager.ensureWorkspace(userId) : undefined
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}/init`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspacePath }),
          signal: AbortSignal.timeout(OPENCODE_TIMEOUT),
        }
      )
      if (!res.ok) return NextResponse.json({ error: "Init failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "run-command") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const { command, arguments: args } = body
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}/command`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, arguments: args }),
          signal: AbortSignal.timeout(OPENCODE_TIMEOUT),
        }
      )
      if (!res.ok) return NextResponse.json({ error: "Command failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "run-shell") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const { command } = body
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}/shell`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
          signal: AbortSignal.timeout(OPENCODE_TIMEOUT),
        }
      )
      if (!res.ok) return NextResponse.json({ error: "Shell command failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "delete-session") {
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}`,
        {
          method: "DELETE",
          signal: AbortSignal.timeout(OPENCODE_TIMEOUT),
        }
      )
      if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: 502 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
