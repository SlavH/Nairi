"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Circle, Play, ChevronLeft, Lock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Lesson {
  id: string
  title: string
  description: string
  content_type: string
  duration_minutes: number
  order_index: number
  is_free: boolean
}

interface Course {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
  estimated_hours: number
  lessons: Lesson[]
}

interface LessonProgress {
  lesson_id: string
  completed: boolean
  progress_percentage: number
}

interface CourseDetailProps {
  course: Course
  progress: LessonProgress[]
  userId: string
}

export function CourseDetail({ course, progress, userId }: CourseDetailProps) {
  const [isStarting, setIsStarting] = useState(false)

  const sortedLessons = [...(course.lessons || [])].sort((a, b) => a.order_index - b.order_index)
  const completedLessons = progress.filter((p) => p.completed).length
  const totalLessons = sortedLessons.length
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lesson_id === lessonId && p.completed)
  }

  const getLessonProgress = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId)?.progress_percentage || 0
  }

  const handleStartLesson = async (lessonId: string) => {
    setIsStarting(true)
    const supabase = createClient()

    // Create or update progress record
    const existing = progress.find((p) => p.lesson_id === lessonId)
    if (!existing) {
      await supabase.from("lesson_progress").insert({
        user_id: userId,
        lesson_id: lessonId,
        progress_percentage: 0,
        completed: false,
      })
    }

    // Navigate to lesson (would be implemented with actual lesson viewer)
    setIsStarting(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-500"
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500"
      case "advanced":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/5 backdrop-blur-sm shrink-0">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Learn
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge className={getDifficultyColor(course.difficulty)}>{course.difficulty}</Badge>
              <h1 className="text-2xl font-bold text-foreground mt-2">{course.title}</h1>
              <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {completedLessons}/{totalLessons}
                </p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{course.estimated_hours}h</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Course Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Course Content</h2>
            {sortedLessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id)
              const lessonProgress = getLessonProgress(lesson.id)
              const isLocked = !lesson.is_free && index > 0 && !isLessonCompleted(sortedLessons[index - 1].id)

              return (
                <Card key={lesson.id} className={`bg-white/5 backdrop-blur-md border-white/20 ${isLocked ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {completed ? (
                          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        ) : isLocked ? (
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Lesson {index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {lesson.content_type}
                          </Badge>
                          {lesson.is_free && (
                            <Badge variant="secondary" className="text-xs">
                              Free
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        {lessonProgress > 0 && lessonProgress < 100 && (
                          <Progress value={lessonProgress} className="h-1 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {lesson.duration_minutes}m
                        </span>
                        <Button
                          size="sm"
                          disabled={isLocked || isStarting}
                          onClick={() => handleStartLesson(lesson.id)}
                          className={
                            completed
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                          }
                        >
                          {completed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Review
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Course Info Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle>Course Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{course.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <Badge className={getDifficultyColor(course.difficulty)}>{course.difficulty}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lessons</span>
                  <span>{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{course.estimated_hours} hours</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle>What you'll learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span className="text-sm">Master core concepts and foundations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span className="text-sm">Build practical skills through exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                    <span className="text-sm">Earn XP and unlock new abilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
