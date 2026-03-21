/**
 * Chat File Upload API (Phase 40)
 * Handles file uploads for multimodal chat
 */
import { NextRequest, NextResponse } from "next/server";
import { MultimodalHandler } from "@/lib/chat/multimodal";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return handleError(validationError("File is required"));
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return handleError(validationError(`File size exceeds ${MAX_SIZE} bytes`));
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/webm",
      "audio/mpeg",
      "application/pdf",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return handleError(validationError(`File type ${file.type} not allowed`));
    }

    const { url, metadata } = await MultimodalHandler.uploadFile(file, userId);

    return NextResponse.json({
      success: true,
      url,
      metadata,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
        ? "voice"
        : "file",
    });
  } catch (error) {
    return handleError(error);
  }
});
