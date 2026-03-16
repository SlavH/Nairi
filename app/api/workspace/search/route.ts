/**
 * Workspace Search API (Phase 31)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const folderId = searchParams.get("folderId");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const type = searchParams.get("type");

    if (!query.trim()) {
      return NextResponse.json({ creations: [] });
    }

    let creationsQuery = supabase
      .from("creations")
      .select("*")
      .eq("user_id", userId)
      .or(`prompt.ilike.%${query}%,content.ilike.%${query}%`);

    if (folderId) {
      creationsQuery = creationsQuery.eq("folder_id", folderId);
    }

    if (tags && tags.length > 0) {
      creationsQuery = creationsQuery.contains("tags", tags);
    }

    if (type) {
      creationsQuery = creationsQuery.eq("type", type);
    }

    const { data: creations, error } = await creationsQuery.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ creations: creations || [], query });
  } catch (error) {
    return handleError(error);
  }
});
