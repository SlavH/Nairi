/**
 * Workspace Activity Feed API (Phase 32)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";

export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();

    // Check access
    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", params.id)
      .single();

    const { data: share } = await supabase
      .from("workspace_shares")
      .select("permission")
      .eq("creation_id", params.id)
      .or(`shared_with.eq.${userId},shared_with.is.null`)
      .single();

    if (!creation || (creation.user_id !== userId && !share)) {
      return handleError(unauthorizedError("Access denied"));
    }

    // Get activities
    const { data: activities, error } = await supabase
      .from("workspace_activities")
      .select("*, profiles:user_id(id, email, full_name)")
      .eq("creation_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ activities: activities || [] });
  } catch (error) {
    return handleError(error);
  }
});
