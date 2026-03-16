/**
 * Model Comparison API – all requests go to Colab (BITNET_BASE_URL).
 */
import { NextRequest, NextResponse } from "next/server";
import { ModelComparison } from "@/lib/chat/model-comparison";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const compareModelsSchema = z.object({
  prompt: z.string().min(1).max(10000),
  models: z.array(
    z.object({
      provider: z.string(),
      model: z.string(),
    })
  ).min(1).max(5),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ).optional(),
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const body = await req.json();
    const { prompt, models, conversationHistory } = compareModelsSchema.parse(body);

    const results = await ModelComparison.compareModels(
      prompt,
      models,
      conversationHistory
    );

    return NextResponse.json({
      success: true,
      results,
      prompt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
