/**
 * Builder Project Collaborators API (Phase 24)
 * Manage project collaborators
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, forbiddenError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const addCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
});

export const GET = withLogging(async (
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

    // Check if user has access to project
    const { data: project } = await supabase
      .from("builder_projects")
      .select("user_id, is_public")
      .eq("id", id)
      .single();

    if (!project) {
      return handleError(validationError("Project not found"));
    }

    if (project.user_id !== userId && !project.is_public) {
      return handleError(forbiddenError("Access denied"));
    }

    // Get collaborators
    const { data: collaborators, error } = await supabase
      .from("builder_project_collaborators")
      .select("*, profiles:user_id(id, email, full_name)")
      .eq("project_id", id);

    if (error) throw error;

    return NextResponse.json({ collaborators: collaborators || [] });
  } catch (error) {
    return handleError(error);
  }
});

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

    // Check if user is project owner
    const { data: project } = await supabase
      .from("builder_projects")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!project || project.user_id !== userId) {
      return handleError(forbiddenError("Only project owner can add collaborators"));
    }

    const body = await req.json();
    const { userId: collaboratorId, role } = addCollaboratorSchema.parse(body);

    const { data, error } = await supabase
      .from("builder_project_collaborators")
      .insert({
        project_id: id,
        user_id: collaboratorId,
        role,
        invited_by: userId,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, collaborator: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
