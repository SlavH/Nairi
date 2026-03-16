/**
 * Workspace Sharing API (Phase 32)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { randomBytes } from "crypto";
import { z } from "zod";

const shareSchema = z.object({
  sharedWith: z.string().uuid().optional(), // NULL for public share
  permission: z.enum(["view", "edit", "comment"]).default("view"),
  expiresInHours: z.number().optional(),
});

export const POST = withLogging(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();

    // Check ownership
    const { data: creation } = await supabase
      .from("creations")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (!creation || creation.user_id !== userId) {
      return handleError(validationError("Only owner can share"));
    }

    const body = await req.json();
    const { sharedWith, permission, expiresInHours } = shareSchema.parse(body);

    // Generate share slug for public shares
    const sharedSlug = !sharedWith ? randomBytes(16).toString("hex") : null;

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("workspace_shares")
      .insert({
        creation_id: params.id,
        shared_by: userId,
        shared_with: sharedWith || null,
        permission,
        shared_slug: sharedSlug,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    // Update creation with share slug if public
    if (sharedSlug) {
      await supabase
        .from("creations")
        .update({ shared_slug: sharedSlug })
        .eq("id", params.id);
    }

    return NextResponse.json({
      success: true,
      share: data,
      shareUrl: sharedSlug ? `/workspace/shared/${sharedSlug}` : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
