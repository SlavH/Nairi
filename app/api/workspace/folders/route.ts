/**
 * Workspace Folders API (Phase 31)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const { data: folders, error } = await supabase
      .from("workspace_folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ folders: folders || [] });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const body = await req.json();
    const { name, parentId, color, icon } = createFolderSchema.parse(body);

    const { data, error } = await supabase
      .from("workspace_folders")
      .insert({
        user_id: userId,
        name,
        parent_id: parentId || null,
        color,
        icon,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, folder: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
