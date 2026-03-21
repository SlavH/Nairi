/**
 * Presentation Version History API (Phase 29)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";

export const GET = withLogging(async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const params = context.params;
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    // Check access
    const { data: collaborator } = await supabase
      .from("presentation_collaborators")
      .select("role")
      .eq("presentation_id", params.id)
      .eq("user_id", userId)
      .single();

    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (!creation) {
      return handleError(validationError("Presentation not found"));
    }

    if (creation.user_id !== userId && !collaborator) {
      return handleError(validationError("Access denied"));
    }

    // Get versions
    const { data: versions, error } = await supabase
      .from("presentation_versions")
      .select("*, profiles:created_by(id, email, full_name)")
      .eq("presentation_id", params.id)
      .order("version_number", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ versions: versions || [] });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = withLogging(async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const params = context.params;
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    // Check edit access
    const { data: collaborator } = await supabase
      .from("presentation_collaborators")
      .select("role")
      .eq("presentation_id", params.id)
      .eq("user_id", userId)
      .single();

    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (!creation) {
      return handleError(validationError("Presentation not found"));
    }

    if (creation.user_id !== userId && collaborator?.role !== "editor" && collaborator?.role !== "owner") {
      return handleError(validationError("Edit access required"));
    }

    const body = await req.json();
    const { content, changeSummary } = body;

    // Get next version number
    const { data: lastVersion } = await supabase
      .from("presentation_versions")
      .select("version_number")
      .eq("presentation_id", params.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    // Create version
    const { data, error } = await supabase
      .from("presentation_versions")
      .insert({
        presentation_id: params.id,
        version_number: nextVersion,
        content,
        change_summary: changeSummary,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, version: data });
  } catch (error) {
    return handleError(error);
  }
});
