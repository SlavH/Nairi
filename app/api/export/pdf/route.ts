import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Simple PDF generation without external dependencies
// Uses a minimal PDF structure that browsers can render

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

function wrapText(text: string, maxWidth: number = 80): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function generatePDF(title: string, date: string, messages: Array<{ role: string; content: string; created_at: string }>): Buffer {
  // Build PDF content
  let yPosition = 750
  const lineHeight = 14
  const pageWidth = 612
  const pageHeight = 792
  const margin = 50
  const contentWidth = pageWidth - (margin * 2)
  const maxCharsPerLine = 85

  // Collect all text objects
  const textObjects: string[] = []
  
  // Title
  textObjects.push(`BT /F1 18 Tf ${margin} ${yPosition} Td (${escapeText(title)}) Tj ET`)
  yPosition -= 25
  
  // Date
  textObjects.push(`BT /F1 10 Tf ${margin} ${yPosition} Td (Date: ${escapeText(date)}) Tj ET`)
  yPosition -= 20
  
  // Separator line
  textObjects.push(`${margin} ${yPosition} m ${pageWidth - margin} ${yPosition} l S`)
  yPosition -= 20

  // Messages
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'You' : 'Nairi'
    const timestamp = new Date(msg.created_at).toLocaleTimeString()
    
    // Check if we need a new page
    if (yPosition < 100) {
      yPosition = 750
    }
    
    // Role header
    textObjects.push(`BT /F1 11 Tf ${margin} ${yPosition} Td (${escapeText(`${role} (${timestamp}):`)}) Tj ET`)
    yPosition -= lineHeight + 2
    
    // Message content - wrap lines
    const contentLines = msg.content.split('\n')
    for (const paragraph of contentLines) {
      const wrappedLines = wrapText(paragraph, maxCharsPerLine)
      for (const line of wrappedLines) {
        if (yPosition < 50) {
          yPosition = 750
        }
        textObjects.push(`BT /F1 10 Tf ${margin + 10} ${yPosition} Td (${escapeText(line)}) Tj ET`)
        yPosition -= lineHeight
      }
      if (wrappedLines.length === 0) {
        yPosition -= lineHeight / 2
      }
    }
    yPosition -= 10
  }

  // Build PDF structure
  const streamContent = textObjects.join('\n')
  const streamLength = Buffer.byteLength(streamContent, 'utf8')

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000${(streamLength + 320).toString().padStart(3, '0')} 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
${streamLength + 420}
%%EOF`

  return Buffer.from(pdf, 'utf8')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, content, title: customTitle, documentType } = body

    // Handle direct content export (for documents)
    if (content) {
      const title = customTitle || 'Nairi Document'
      const date = new Date().toLocaleString()
      const messages = [{
        role: 'assistant',
        content: content,
        created_at: new Date().toISOString()
      }]
      
      const pdfBuffer = generatePDF(title, date, messages)
      
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="nairi-document-${Date.now()}.pdf"`,
        },
      })
    }

    // Handle conversation export
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID or content required" }, { status: 400 })
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

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 })
    }

    const title = conversation.title || 'Nairi Conversation'
    const date = new Date(conversation.created_at).toLocaleString()
    
    const pdfBuffer = generatePDF(title, date, messages)

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nairi-chat-${conversationId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF Export error:", error)
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 })
  }
}

// Also support GET for simple document generation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get('text')
  const title = searchParams.get('title') || 'Document'
  
  if (!text) {
    return NextResponse.json({ 
      status: 'PDF Export API Active',
      usage: 'POST with { conversationId } or { content, title }',
      formats: ['pdf']
    })
  }
  
  const date = new Date().toLocaleString()
  const messages = [{
    role: 'assistant',
    content: text,
    created_at: new Date().toISOString()
  }]
  
  const pdfBuffer = generatePDF(title, date, messages)
  
  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    },
  })
}
