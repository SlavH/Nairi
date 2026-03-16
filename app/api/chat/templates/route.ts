import { NextResponse } from "next/server"
import { CHAT_TEMPLATES } from "@/lib/features/chat"

export async function GET() {
  return NextResponse.json({ templates: CHAT_TEMPLATES })
}
