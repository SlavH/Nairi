/**
 * Learn Achievements API (Phase 52)
 * GET - User achievements; POST - Check and unlock achievements
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AchievementSystem } from "@/lib/learn/achievements";
import { handleError } from "@/lib/errors/handler";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", user.id);

    const achievements = (userAchievements || []).map((ua: { achievements: unknown }) => ua.achievements).filter(Boolean);
    return NextResponse.json({ achievements });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newlyUnlocked = await AchievementSystem.checkAchievements(user.id);
    return NextResponse.json({ success: true, newlyUnlocked });
  } catch (error) {
    return handleError(error);
  }
}
