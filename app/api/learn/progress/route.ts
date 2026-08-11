/**
 * Learn Progress API (Phase 51)
 * GET - User learning progress across courses
 */
import { NextResponse } from "next/server";

import { handleError } from "@/lib/errors/handler";
import { LearningProgressTracker } from "@/lib/learn/progress-tracker";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await LearningProgressTracker.getUserProgress(user.id);
    return NextResponse.json({ progress });
  } catch (error) {
    return handleError(error);
  }
}
