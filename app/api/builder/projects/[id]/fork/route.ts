/**
 * Builder Project Fork API (Phase 24)
 * Fork a project to create a copy
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";

export const POST = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();

    // Get original project
    const { data: originalProject, error: fetchError } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalProject) {
      return handleError(validationError("Project not found"));
    }

    // Check if project is public or user has access
    if (!originalProject.is_public && originalProject.user_id !== userId) {
      const { data: collaborator } = await supabase
        .from("builder_project_collaborators")
        .select("role")
        .eq("project_id", id)
        .eq("user_id", userId)
        .single();

      if (!collaborator) {
        return handleError(validationError("Project not accessible"));
      }
    }

    // Create forked project
    const { data: forkedProject, error: forkError } = await supabase
      .from("builder_projects")
      .insert({
        user_id: userId,
        name: `${originalProject.name} (Fork)`,
        files: originalProject.files,
      })
      .select()
      .single();

    if (forkError) throw forkError;

    // Record fork relationship
    const { error: forkRecordError } = await supabase
      .from("builder_project_forks")
      .insert({
        original_project_id: id,
        forked_project_id: forkedProject.id,
        forked_by: userId,
      });

    if (forkRecordError) throw forkRecordError;

    return NextResponse.json({
      success: true,
      project: forkedProject,
      originalProjectId: id,
    });
  } catch (error) {
    return handleError(error);
  }
});
