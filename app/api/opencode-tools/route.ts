/**
 * POST /api/opencode-tools — expose OpenCode tools to Nairi
 * Uses the same OPENCODE_API_URL as the chat backend
 */
import { NextRequest, NextResponse } from "next/server"

const OPENCODE_API_URL = process.env.OPENCODE_API_URL || "https://solidary-baroquely-leola.ngrok-free.dev"
const OPENCODE_TIMEOUT = 120_000

// GET /api/opencode-tools?action=search&q=<query>
// Search files in the project
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const sessionId = searchParams.get("sessionId")

  try {
    if (action === "search") {
      const pattern = searchParams.get("pattern") || ""
      const res = await fetch(
        `${OPENCODE_API_URL}/find?pattern=${encodeURIComponent(pattern)}`,
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
      const res = await fetch(
        `${OPENCODE_API_URL}/file?path=${encodeURIComponent(path)}`,
        { signal: AbortSignal.timeout(OPENCODE_TIMEOUT) }
      )
      if (!res.ok) return NextResponse.json({ error: "File read failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "list-files") {
      const path = searchParams.get("path") || ""
      const res = await fetch(
        `${OPENCODE_API_URL}/file?path=${encodeURIComponent(path)}`,
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
  try {
    const body = await req.json()
    const { action, sessionId } = body

    if (action === "init-project") {
      // Analyze project and create AGENTS.md
      if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })
      const res = await fetch(
        `${OPENCODE_API_URL}/session/${sessionId}/init`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(OPENCODE_TIMEOUT),
        }
      )
      if (!res.ok) return NextResponse.json({ error: "Init failed" }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    if (action === "run-command") {
      // Run a slash command (e.g., /init, /undo)
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
      // Run a shell command via OpenCode
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
