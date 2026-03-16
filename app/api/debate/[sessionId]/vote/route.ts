/**
 * Debate Vote API (Phase 48)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const voteSchema = z.object({
  position: z.string().min(1),
});

export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();

    const { data: votes, error } = await supabase
      .from("debate_votes")
      .select("position")
      .eq("session_id", sessionId);

    if (error) throw error;

    const voteCounts = (votes || []).reduce((acc, v) => {
      acc[v.position] = (acc[v.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ voteCounts });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  try {
    const { sessionId } = await params;
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    const supabase = await createClient();

    // Check if session exists
    const { data: session } = await supabase
      .from("debate_sessions")
      .select("id")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return handleError(validationError("Debate session not found"));
    }

    const body = await req.json();
    const { position } = voteSchema.parse(body);

    // Upsert vote
    const { data, error } = await supabase
      .from("debate_votes")
      .upsert({
        session_id: sessionId,
        user_id: userId,
        position,
      })
      .select()
      .single();

    if (error) throw error;

    // Get vote counts
    const { data: votes } = await supabase
      .from("debate_votes")
      .select("position")
      .eq("session_id", sessionId);

    const voteCounts = (votes || []).reduce((acc, v) => {
      acc[v.position] = (acc[v.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      vote: data,
      voteCounts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
