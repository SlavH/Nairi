import { NextResponse } from "next/server"
import { getSharedConversation } from "@/lib/features/chat"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  const data = await getSharedConversation(slug)
  if (!data) return NextResponse.json({ error: "Not found or expired" }, { status: 404 })
  return NextResponse.json(data)
}
