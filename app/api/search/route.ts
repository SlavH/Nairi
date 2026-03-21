/**
 * Global Search API (Phase 60)
 */
import { NextRequest, NextResponse } from "next/server";
import { GlobalSearch } from "@/lib/search/global-search";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const types = searchParams.get("types")?.split(",");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query.trim()) {
      return handleError(validationError("Query parameter 'q' is required"));
    }

    const results = await GlobalSearch.search(query, userId, {
      types: types as any,
      limit,
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    return handleError(error);
  }
});
