"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Trophy,
  Target,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  NotebookPen,
} from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
  thumbnail_url?: string
  estimated_hours: number
  lessons: { count: number }[]
}

interface UserSkill {
  id: string
  skill_node_id: string
  proficiency_level: number
  xp_earned: number
  skill_nodes: {
    name: string
    description: string
    icon: string
  }
}

interface LearningPath {
  id: string
  title: string
  description: string
  category: string
}

interface LearnDashboardProps {
  courses: Course[]
  userSkills: UserSkill[]
  learningPaths: LearningPath[]
  completedLessons: { id: string }[]
  userId: string
}

export function LearnDashboard({ courses, userSkills, learningPaths, completedLessons, userId }: LearnDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const totalXP = userSkills.reduce((sum, skill) => sum + skill.xp_earned, 0)
  const completedCount = completedLessons.length
  const streakDays = 7 // Would be calculated from actual data

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nairi Learn</h1>
              <p className="text-muted-foreground">Your personalized learning journey</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/learn/notebooks">
                <Button className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                  <NotebookPen className="h-4 w-4" />
                  NairiBook
                </Button>
              </Link>
              <Link href="/learn/skill-tree">
                <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-foreground hover:bg-white/10">
                  <Target className="h-4 w-4" />
                  Skill Tree
                </Button>
              </Link>
              <Link href="/learn/mentors">
                <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-foreground hover:bg-white/10">
                  <Sparkles className="h-4 w-4" />
                  AI Mentors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-[#e052a0]/10 to-[#00c9c8]/10 backdrop-blur-md border-white/20 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount} lessons</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{streakDays} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skills Mastered</p>
                <p className="text-2xl font-bold">{userSkills.filter((s) => s.proficiency_level >= 80).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white/5 border border-white/20 backdrop-blur-sm">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:border-white/20">
              <NotebookPen className="h-4 w-4" />
              NairiBook
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-white/10 data-[state=active]:border-white/20">Courses</TabsTrigger>
            <TabsTrigger value="paths" className="data-[state=active]:bg-white/10 data-[state=active]:border-white/20">Learning Paths</TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-white/10 data-[state=active]:border-white/20">My Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* NairiBook */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/20 shadow-xl border-[#e052a0]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotebookPen className="h-5 w-5" />
                  NairiBook
                </CardTitle>
                <CardDescription>
                  Add sources (paste text or URLs), then ask questions. AI answers only from your materials with citations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/learn/notebooks">
                  <Button className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                    Open NairiBook
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Continue Learning */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Continue Learning
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.slice(0, 3).map((course) => (
                      <Link key={course.id} href={`/learn/courses/${course.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-colors">
                          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getDifficultyColor(course.difficulty)}>{course.difficulty}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.estimated_hours}h
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card className="bg-white/5 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Skill Progress
                </CardTitle>
                <CardDescription>Your top skills by proficiency</CardDescription>
              </CardHeader>
              <CardContent>
                {userSkills.length > 0 ? (
                  <div className="space-y-4">
                    {userSkills
                      .sort((a, b) => b.proficiency_level - a.proficiency_level)
                      .slice(0, 5)
                      .map((skill) => (
                        <div key={skill.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill_nodes?.name}</span>
                            <span className="text-sm text-muted-foreground">{skill.proficiency_level}%</span>
                          </div>
                          <Progress value={skill.proficiency_level} className="h-2" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Start learning to build your skills!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/learn/courses/${course.id}`}>
                  <Card className="h-full bg-white/5 backdrop-blur-md border-white/20 hover:border-white/30 transition-all cursor-pointer">
                    <div className="h-40 bg-gradient-to-br from-[#e052a0] to-[#00c9c8] rounded-t-lg flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <Badge className={getDifficultyColor(course.difficulty)} variant="secondary">
                        {course.difficulty}
                      </Badge>
                      <h3 className="font-semibold mt-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.lessons?.[0]?.count || 0} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.estimated_hours}h
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {courses.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No courses available yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paths">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <Card key={path.id} className="bg-white/5 backdrop-blur-md border-white/20 hover:border-white/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{path.title}</CardTitle>
                        <Badge variant="outline">{path.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{path.description}</p>
                    <Button className="w-full mt-4 border-white/20 bg-white/5 text-foreground hover:bg-white/10" variant="outline">
                      Start Path
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {learningPaths.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No learning paths available yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSkills.map((skill) => (
                <Card key={skill.id} className="bg-white/5 backdrop-blur-md border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{skill.skill_nodes?.name}</h3>
                        <p className="text-xs text-muted-foreground">{skill.xp_earned} XP earned</p>
                      </div>
                    </div>
                    <Progress value={skill.proficiency_level} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">{skill.proficiency_level}% proficiency</p>
                  </CardContent>
                </Card>
              ))}
              {userSkills.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Complete lessons to unlock skills!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
