/**
 * Agent Reviews API (Phase 44)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { getUserIdOrBypassForApi } from "@/lib/auth";
import { z } from "zod";

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(2000),
});

export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) => {
  try {
    const { agentId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: reviews, error } = await supabase
      .from("agent_reviews")
      .select("*, profiles:user_id(id, email, full_name, avatar_url)")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error) {
    return handleError(error);
  }
});

export const POST = withLogging(async (
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) => {
  const { agentId } = await context.params;
  try {
    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());
    if (!userId) {
      return handleError(unauthorizedError("Authentication required"));
    }

    // Check if user owns the agent
    const { data: userAgent } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .single();

    if (!userAgent) {
      return handleError(validationError("You must own the agent to review it"));
    }

    // Check if review already exists
    const { data: existing } = await supabase
      .from("agent_reviews")
      .select("id")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      return handleError(validationError("You have already reviewed this agent"));
    }

    const body = await req.json();
    const { rating, title, content } = createReviewSchema.parse(body);

    // Create review
    const { data: review, error } = await supabase
      .from("agent_reviews")
      .insert({
        agent_id: agentId,
        user_id: userId,
        rating,
        title,
        content,
        is_verified_purchase: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Create moderation entry
    await supabase.from("review_moderation").insert({
      review_id: review.id,
      status: "pending",
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
