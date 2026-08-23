/**
 * Builder Project Collaborators API (Phase 24)
 * Manage project collaborators
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserIdForApi } from "@/lib/auth";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, forbiddenError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security/request-validator";
import { createClient } from "@/lib/supabase/server";


// "owner" is reserved for the project's user_id; collaborators may only be
// editors or viewers.
const addCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["editor", "viewer"]),
});

export const GET = withLogging(async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const params = context.params;
  try {
    const supabase = await createClient();
    const userId = await getUserIdForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    // Check if user has access to project
    const { data: project } = await supabase
      .from("builder_projects")
      .select("user_id, is_public")
      .eq("id", params.id)
      .single();

    if (!project) {
      return handleError(validationError("Project not found"));
    }

    if (project.user_id !== userId && !project.is_public) {
      return handleError(forbiddenError("Access denied"));
    }

    // Get collaborators. Email is deliberately excluded: anyone who can view
    // a public project may list collaborators, and email addresses must not
    // be disclosed to them (F16).
    const { data: collaborators, error } = await supabase
      .from("builder_project_collaborators")
      .select("*, profiles:user_id(id, full_name)")
      .eq("project_id", params.id);

    if (error) throw error;

    return NextResponse.json({ collaborators: collaborators || [] });
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
    const originGuard = assertSameOrigin(req);
    if (originGuard) return originGuard;

    const supabase = await createClient();
    const userId = await getUserIdForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const clientId = getClientIdentifier(req);
    const rateLimitResult = checkRateLimit(`collab:${clientId}`, RATE_LIMITS.create);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    // Check if user is project owner
    const { data: project } = await supabase
      .from("builder_projects")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (!project || project.user_id !== userId) {
      return handleError(forbiddenError("Only project owner can add collaborators"));
    }

    const body = await req.json();
    const { userId: collaboratorId, role } = addCollaboratorSchema.parse(body);

    const { data, error } = await supabase
      .from("builder_project_collaborators")
      .insert({
        project_id: params.id,
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
