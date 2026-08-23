/**
 * Agent Reviews API (Phase 44)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserIdForApi } from "@/lib/auth";
import { handleError } from "@/lib/errors/handler";
import { unauthorizedError, validationError } from "@/lib/errors/types";
import { withLogging } from "@/lib/logging/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


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
      .select("id, agent_id, user_id, rating, title, content, is_verified_purchase, helpful_count, created_at, updated_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // user_id references auth.users (no FK to profiles), so PostgREST cannot
    // embed profiles directly. Fetch author display info separately and never
    // expose email addresses (F20).
    const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
    const authors = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      for (const p of profileRows ?? []) {
        authors.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
      }
    }

    const enriched = (reviews ?? []).map((r) => ({
      ...r,
      author: authors.get(r.user_id) ?? { full_name: null, avatar_url: null },
    }));

    return NextResponse.json({ reviews: enriched });
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
    const userId = await getUserIdForApi(() => supabase.auth.getUser());
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

    // review_moderation INSERT is denied for user sessions by RLS; the
    // moderation queue is a system-owned write, so use the service-role
    // client and surface failures instead of ignoring them (F20).
    const admin = createAdminClient();
    const { error: moderationError } = await admin.from("review_moderation").insert({
      review_id: review.id,
      status: "pending",
    });
    if (moderationError) {
      console.error("Failed to create moderation entry:", moderationError);
      return NextResponse.json(
        { error: "Review saved but could not be queued for moderation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleError(validationError("Invalid request", error.errors));
    }
    return handleError(error);
  }
});
