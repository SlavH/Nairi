/**
 * Learning Progress Tracker (Phase 46)
 * Aligns with DB: lesson_progress (scripts 008, 038, 044), learning_analytics (038).
 * Course → lessons via course_modules (no direct lessons.course_id); progress uses lesson_progress.completed.
 */
import { createClient } from "@/lib/supabase/server";

export interface LearningProgress {
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  timeSpent: number; // minutes
  lastAccessed: Date;
}

export class LearningProgressTracker {
  /**
   * Get user's learning progress
   */
  static async getUserProgress(userId: string): Promise<LearningProgress[]> {
    const supabase = await createClient();

    // Get all courses with progress
    const { data: courses } = await supabase.from("courses").select("id, title");

    const progress: LearningProgress[] = [];

    for (const course of courses || []) {
      // Total lessons: lessons belong to modules, modules belong to course
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id")
        .eq("course_id", course.id);
      const moduleIds = modules?.map((m) => m.id) || [];
      const { count: totalLessons } =
        moduleIds.length > 0
          ? await supabase
              .from("lessons")
              .select("*", { count: "exact", head: true })
              .in("module_id", moduleIds)
          : { count: 0 };

      // Completed lessons: lesson_progress (user_id, lesson_id, completed) joined to lessons -> course_modules
      let completedLessons = 0;
      if (moduleIds.length > 0) {
        const { data: lessonIds } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);
        const ids = lessonIds?.map((l) => l.id) || [];
        if (ids.length > 0) {
          const { count } = await supabase
            .from("lesson_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("completed", true)
            .in("lesson_id", ids);
          completedLessons = count ?? 0;
        }
      }

      // Time spent: prefer learning_analytics (038), fallback to lesson_progress.time_spent_seconds
      let timeSpent = 0;
      const { data: analytics } = await supabase
        .from("learning_analytics")
        .select("metric_value")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .eq("metric_type", "time_spent");
      if (analytics?.length) {
        timeSpent = analytics.reduce((sum, a) => sum + (Number(a.metric_value) || 0), 0);
      } else if (moduleIds.length > 0) {
        const { data: lessonIds } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);
        const ids = lessonIds?.map((l) => l.id) || [];
        if (ids.length > 0) {
          const { data: lp } = await supabase
            .from("lesson_progress")
            .select("time_spent_seconds")
            .eq("user_id", userId)
            .in("lesson_id", ids);
          timeSpent = (lp || []).reduce((s, r) => s + (r.time_spent_seconds || 0), 0) / 60;
        }
      }

      // Last accessed: learning_analytics created_at or lesson_progress completed_at
      let lastAccessed = new Date();
      const { data: lastAccess } = await supabase
        .from("learning_analytics")
        .select("created_at")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastAccess?.created_at) lastAccessed = new Date(lastAccess.created_at);

      progress.push({
        courseId: course.id,
        courseTitle: course.title,
        completedLessons,
        totalLessons: totalLessons ?? 0,
        progressPercent:
          (totalLessons ?? 0) > 0
            ? Math.round((completedLessons / (totalLessons ?? 1)) * 100)
            : 0,
        timeSpent,
        lastAccessed,
      });
    }

    return progress;
  }

  /**
   * Record learning activity
   */
  static async recordActivity(
    userId: string,
    courseId: string,
    lessonId: string,
    metricType: string,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("learning_analytics").insert({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      metric_type: metricType,
      metric_value: value,
      metadata,
    });
    if (error && metricType === "time_spent") {
      // Fallback: learning_analytics may not exist (038 not run); update lesson_progress
      await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            time_spent_seconds: Math.round(value * 60),
          },
          { onConflict: "user_id,lesson_id" }
        );
    }
  }

  /**
   * Get learning recommendations
   */
  static async getRecommendations(userId: string): Promise<Array<{
    courseId: string;
    reason: string;
    score: number;
  }>> {
    const supabase = await createClient();

    // Completed courses: from course_enrollments where completed_at is set
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .not("completed_at", "is", null);
    const completedIds = new Set(enrollments?.map((e) => e.course_id) || []);

    // Get recommended courses from learning_recommendations (038) when table exists
    const { data: recommendations, error } = await supabase
      .from("learning_recommendations")
      .select("course_id, reason, score")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(10);

    if (error) return []; // Table may not exist
    const filtered = (recommendations || []).filter((r) => r.course_id && !completedIds.has(r.course_id));
    return filtered.map((r) => ({
      courseId: r.course_id,
      reason: r.reason ?? "Recommended",
      score: Number(r.score ?? 0),
    }));
  }
}
