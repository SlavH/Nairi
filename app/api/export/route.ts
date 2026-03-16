import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, format } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    // Fetch conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Fetch messages
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!messages) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 })
    }

    // Format based on requested type
    if (format === "txt") {
      let content = `Nairi Conversation: ${conversation.title}\n`
      content += `Date: ${new Date(conversation.created_at).toLocaleString()}\n`
      content += `\n${"-".repeat(80)}\n\n`

      messages.forEach((msg) => {
        const role = msg.role === "user" ? "You" : "Nairi"
        const timestamp = new Date(msg.created_at).toLocaleTimeString()
        content += `[${timestamp}] ${role}:\n${msg.content}\n\n`
      })

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="nairi-chat-${conversationId}.txt"`,
        },
      })
    } else if (format === "json") {
      const exportData = {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
        },
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          metadata: msg.metadata,
        })),
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="nairi-chat-${conversationId}.json"`,
        },
      })
    } else if (format === "md") {
      let content = `# ${conversation.title}\n\n`
      content += `**Date:** ${new Date(conversation.created_at).toLocaleString()}\n\n`
      content += `---\n\n`

      messages.forEach((msg) => {
        const role = msg.role === "user" ? "**You**" : "**Nairi**"
        const timestamp = new Date(msg.created_at).toLocaleTimeString()
        content += `### ${role} _(${timestamp})_\n\n${msg.content}\n\n`
      })

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="nairi-chat-${conversationId}.md"`,
        },
      })
    } else if (format === "pdf") {
      // Redirect to PDF export endpoint
      const pdfResponse = await fetch(new URL('/api/export/pdf', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
      
      if (!pdfResponse.ok) {
        return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
      }
      
      const pdfBuffer = await pdfResponse.arrayBuffer()
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="nairi-chat-${conversationId}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: "Invalid format. Supported: txt, json, md, pdf" }, { status: 400 })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
