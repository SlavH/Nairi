import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { CourseDetail } from "@/components/learn/course-detail"
import { getSessionOrBypass } from "@/lib/auth"

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    notFound()
  }

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id)
  let lessons: { id: string; title: string; description?: string; content_type?: string; duration_minutes: number; order_index: number; is_free?: boolean; module_id: string }[] = []

  if (moduleIds.length > 0) {
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("id, title, description, lesson_type, duration_minutes, order_index, module_id")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true })
    lessons = (lessonsData ?? []).map((l) => ({
      ...l,
      content_type: (l as { lesson_type?: string }).lesson_type ?? "text",
      is_free: true,
    }))
  }

  const lessonIds = lessons.map((l) => l.id)
  let progress: { lesson_id: string; completed: boolean; progress_percentage: number }[] = []

  if (lessonIds.length > 0) {
    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed, progress_percentage")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds)
    progress = (progressData ?? []).map((p) => ({
      lesson_id: p.lesson_id,
      completed: p.completed ?? false,
      progress_percentage: p.progress_percentage ?? 0,
    }))
  }

  const courseWithLessons = {
    ...course,
    lessons,
  }

  return (
    <CourseDetail
      course={courseWithLessons}
      progress={progress}
      userId={user.id}
    />
  )
}
