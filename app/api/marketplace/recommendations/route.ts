/**
 * GET /api/marketplace/recommendations — agent recommendations for the current user (Phase 41)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RecommendationEngine } from "@/lib/marketplace/recommendation";
import { handleError } from "@/lib/errors/handler";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);

    const recommendations = await RecommendationEngine.getRecommendations(user.id, limit);

    return NextResponse.json({ recommendations });
  } catch (error) {
    return handleError(error);
  }
}
