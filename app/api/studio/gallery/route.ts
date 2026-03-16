/**
 * Studio Gallery API (Phase 33-35)
 * Manage studio media gallery
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const createGalleryItemSchema = z.object({
  mediaType: z.enum(["image", "video", "audio"]),
  title: z.string().optional(),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

export const GET = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const mediaType = searchParams.get("type");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);

    let query = supabase
      .from("studio_gallery")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    if (tags && tags.length > 0) {
      query = query.contains("tags", tags);
    }

    const { data: items, error } = await query;

    if (error) throw error;

    return NextResponse.json({ items: items || [] });
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
    const {
      mediaType,
      title,
      description,
      fileUrl,
      thumbnailUrl,
      metadata,
      tags,
      isPublic,
    } = createGalleryItemSchema.parse(body);

    const { data, error } = await supabase
      .from("studio_gallery")
      .insert({
        user_id: userId,
        media_type: mediaType,
        title,
        description,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        metadata,
        tags: tags || [],
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
