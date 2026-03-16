/**
 * Knowledge Graph Query API (Phase 51)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  query: z.string().min(1).max(500),
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const body = await req.json();
    const { query } = querySchema.parse(body);

    // Search knowledge nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("knowledge_nodes")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (nodesError) throw nodesError;

    // Search edges (by edge_type)
    const { data: edges, error: edgesError } = await supabase
      .from("knowledge_edges")
      .select("*")
      .eq("user_id", userId)
      .ilike("edge_type", `%${query}%`);

    if (edgesError) throw edgesError;

    // Save query
    await supabase.from("knowledge_queries").insert({
      user_id: userId,
      query_text: query,
      results: {
        nodeCount: nodes?.length || 0,
        edgeCount: edges?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      results: {
        nodes: nodes || [],
        edges: edges || [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
