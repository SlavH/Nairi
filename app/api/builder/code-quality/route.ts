/**
 * Builder Code Quality API (Phase 25)
 * Analyze code quality and provide suggestions
 */
import { NextRequest, NextResponse } from "next/server";
import { CodeQualityAnalyzer } from "@/lib/builder/code-quality";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const analyzeCodeSchema = z.object({
  code: z.string().min(1),
  language: z.enum(["typescript", "javascript", "tsx", "jsx"]).default("typescript"),
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const body = await req.json();
    const { code, language } = analyzeCodeSchema.parse(body);

    const analysis = await CodeQualityAnalyzer.analyzeCode(code, language);
    const suggestions = CodeQualityAnalyzer.getReviewSuggestions(analysis);

    return NextResponse.json({
      ...analysis,
      suggestions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
