/**
 * GET /api/chat/conversations — list current user's conversations.
 * POST /api/chat/conversations — create a new conversation.
 * Auth required (or BYPASS_AUTH in dev). Uses admin client in bypass mode so RLS passes.
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserIdOrBypassForApi, getBypassUserId } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    }

    let client = supabase
    if (userId === getBypassUserId()) {
      try {
        client = createAdminClient()
      } catch {
        return NextResponse.json({ error: "Server configuration error." }, { status: 503 })
      }
    }

    let data: { id: string; title: string; updated_at: string; is_pinned?: boolean; pinned_at?: string | null; folder_id?: string | null }[] | null = null
    let error: { message: string } | null = null

    const withFolder = await client
      .from("conversations")
      .select("id, title, updated_at, is_pinned, pinned_at, folder_id")
      .eq("user_id", userId)
      .order("is_pinned", { ascending: false, nullsFirst: false })
      .order("pinned_at", { ascending: false, nullsFirst: true })
      .order("updated_at", { ascending: false })

    if (withFolder.error) {
      if (withFolder.error.message?.includes("folder_id") || withFolder.error.message?.includes("column")) {
        const withoutFolder = await client
          .from("conversations")
          .select("id, title, updated_at, is_pinned, pinned_at")
          .eq("user_id", userId)
          .order("is_pinned", { ascending: false, nullsFirst: false })
          .order("pinned_at", { ascending: false, nullsFirst: true })
          .order("updated_at", { ascending: false })
        data = withoutFolder.data ?? []
        error = withoutFolder.error
      } else {
        error = withFolder.error
      }
    } else {
      data = withFolder.data
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: "Could not load conversations." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to start a chat." }, { status: 401 })
    }

    let client = supabase
    if (userId === getBypassUserId()) {
      try {
        client = createAdminClient()
      } catch (e) {
        return NextResponse.json(
          { error: "Please sign in to start a chat, or set SUPABASE_SERVICE_ROLE_KEY for development." },
          { status: 503 }
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const folderId = body.folder_id
    const insertPayload: { user_id: string; title: string; folder_id?: string | null } = {
      user_id: userId,
      title: "New Conversation",
    }
    if (folderId !== undefined) {
      insertPayload.folder_id = folderId === null || folderId === "" ? null : folderId
    }
    const { data, error } = await client
      .from("conversations")
      .insert(insertPayload)
      .select("id")
      .single()

    if (error) {
      const msg = String(error.message || "")
      const isFk = /foreign key|violates.*constraint|is not present in table|auth\.users/i.test(msg)
      if (isFk) {
        return NextResponse.json(
          { error: "Please sign in to start a chat." },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || "Could not create conversation" },
        { status: 500 }
      )
    }
    if (!data?.id) {
      return NextResponse.json(
        { error: "No conversation id returned" },
        { status: 500 }
      )
    }
    return NextResponse.json({ id: data.id })
  } catch (e) {
    return NextResponse.json(
      { error: "Could not create conversation. Please try again or sign in." },
      { status: 500 }
    )
  }
}
