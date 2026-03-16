/**
 * GET /api/badges – list all expert badges (catalog)
 */
import { NextResponse } from "next/server"
import { listExpertBadges } from "@/lib/features/badges"
import { handleError } from "@/lib/errors/handler"

export async function GET() {
  try {
    const badges = await listExpertBadges()
    return NextResponse.json({ badges })
  } catch (error) {
    return handleError(error)
  }
}
