/**
 * Presentation Comments API (Phase 29)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const createCommentSchema = z.object({
  slideId: z.number().optional(),
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().uuid().optional(),
});

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
    const { searchParams } = new URL(req.url);
    const slideId = searchParams.get("slideId");

    let query = supabase
      .from("presentation_comments")
      .select("*, profiles:user_id(id, email, full_name)")
      .eq("presentation_id", params.id)
      .order("created_at", { ascending: true });

    if (slideId) {
      query = query.eq("slide_id", parseInt(slideId));
    }

    const { data: comments, error } = await query;

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
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

    const body = await req.json();
    const { slideId, content, parentCommentId } = createCommentSchema.parse(body);

    const { data, error } = await supabase
      .from("presentation_comments")
      .insert({
        presentation_id: params.id,
        slide_id: slideId || null,
        user_id: userId,
        content,
        parent_comment_id: parentCommentId || null,
      })
      .select("*, profiles:user_id(id, email, full_name)")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, comment: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
