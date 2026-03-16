/**
 * Presentation Collaborators API (Phase 29)
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
  role: z.enum(["owner", "editor", "viewer", "commenter"]),
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

    // Check access
    const { data: collaborator } = await supabase
      .from("presentation_collaborators")
      .select("role")
      .eq("presentation_id", id)
      .eq("user_id", userId)
      .single();

    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!creation) {
      return handleError(validationError("Presentation not found"));
    }

    if (creation.user_id !== userId && !collaborator) {
      return handleError(forbiddenError("Access denied"));
    }

    // Get collaborators
    const { data: collaborators, error } = await supabase
      .from("presentation_collaborators")
      .select("*, profiles:user_id(id, email, full_name)")
      .eq("presentation_id", id);

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

    // Check if user is owner
    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!creation || creation.user_id !== userId) {
      return handleError(forbiddenError("Only owner can add collaborators"));
    }

    const body = await req.json();
    const { userId: collaboratorId, role } = addCollaboratorSchema.parse(body);

    const { data, error } = await supabase
      .from("presentation_collaborators")
      .insert({
        presentation_id: id,
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
