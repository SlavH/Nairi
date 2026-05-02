/**
 * SSE proxy: forwards OpenCode /event stream to the browser.
 * Query: ?sessionId=...  (optional filter)
 */
import { NextRequest, NextResponse } from "next/server"

const OPENCODE_URL = process.env.OPENCODE_API_URL || "https://solid-baroquely-leola.ngrok-free.dev"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  const upstream = await fetch(`${OPENCODE_URL}/event`, {
    headers: { Accept: "text/event-stream" },
    // No signal here — we want to keep the connection open
  }).catch((err) => {
    return null
  })

  if (!upstream || !upstream.ok) {
    return NextResponse.json(
      { error: "Cannot connect to OpenCode events" },
      { status: 502 }
    )
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader()
      if (!reader) {
        controller.close()
        return
      }
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Forward complete SSE messages
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            // Parse and optionally filter by sessionId
            if (sessionId && line.includes("sessionID")) {
              try {
                const json = line.replace(/^data:\s*/, "")
                const evt = JSON.parse(json)
                if (evt.properties?.sessionID !== sessionId) continue
              } catch {
                // If we can't parse, forward anyway
              }
            }
            const enc = new TextEncoder()
            controller.enqueue(enc.encode(line + "\n"))
          }
        }
      } catch (e) {
        console.error("[opencode-events] stream error:", e)
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
