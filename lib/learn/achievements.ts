/**
 * Achievements System (Phase 46)
 */
import { createClient } from "@/lib/supabase/server";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

export class AchievementSystem {
  /**
   * Check and unlock achievements for a user
   */
  static async checkAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient();
    const unlocked: Achievement[] = [];

    // Get all achievements
    const { data: achievements } = await supabase.from("achievements").select("*");

    // Get user's existing achievements
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

    for (const achievement of achievements || []) {
      if (unlockedIds.has(achievement.id)) continue;

      // Check if criteria met
      const criteria = achievement.criteria as Record<string, unknown>;
      const met = await this.checkCriteria(userId, criteria);

      if (met) {
        // Unlock achievement
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        unlocked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          points: achievement.points,
        });
      }
    }

    return unlocked;
  }

  /**
   * Check if achievement criteria are met
   */
  private static async checkCriteria(
    userId: string,
    criteria: Record<string, unknown>
  ): Promise<boolean> {
    const supabase = await createClient();

    // Criteria use lesson_progress (user_id, lesson_id, completed)
    if (criteria.type === "complete_course") {
      const courseId = criteria.courseId as string;
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id")
        .eq("course_id", courseId);
      const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
      if (moduleIds.length === 0) return false;
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds);
      const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
      if (lessonIds.length === 0) return true;
      const { count } = await supabase
        .from("lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed", true)
        .in("lesson_id", lessonIds);
      return (count ?? 0) >= lessonIds.length;
    }

    if (criteria.type === "complete_lessons") {
      const count = criteria.count as number;
      const { count: completed } = await supabase
        .from("lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed", true);
      return (completed ?? 0) >= count;
    }

    return false;
  }

  /**
   * Get user's achievements
   */
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_achievements")
      .select("achievements(*)")
      .eq("user_id", userId);

    return (
      data?.map((ua: any) => ({
        id: ua.achievements.id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        icon: ua.achievements.icon,
        category: ua.achievements.category,
        points: ua.achievements.points,
      })) || []
    );
  }
}
