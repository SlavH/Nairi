import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { WorkspaceManager } from "@/lib/workspace/manager"
import { getUserIdForApi } from "@/lib/auth"

const OPENCODE_API_URL = process.env.OPENCODE_API_URL || "http://localhost:4096"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === "init") {
      const workspacePath = await WorkspaceManager.ensureWorkspace(userId)

      const sessRes = await fetch(`${OPENCODE_API_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `nairi-workspace-${userId.slice(0, 8)}`,
          workspacePath,
        }),
      })

      if (!sessRes.ok) {
        const errText = await sessRes.text()
        return NextResponse.json({ error: "Session creation failed", details: errText }, { status: 502 })
      }

      const sessData = await sessRes.json()

      return NextResponse.json({
        success: true,
        sessionId: sessData.id,
        workspacePath,
      })
    }

    if (action === "status") {
      const workspacePath = WorkspaceManager.getWorkspacePath(userId)
      return NextResponse.json({
        workspacePath,
        exists: true,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdForApi(() => supabase.auth.getUser())

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const workspacePath = WorkspaceManager.getWorkspacePath(userId)
    return NextResponse.json({
      userId,
      workspacePath,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
