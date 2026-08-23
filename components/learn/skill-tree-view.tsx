"use client"

import { ChevronLeft, Lock, CheckCircle2, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Shapes mirror the real schema (scripts/008_create_education_tables.sql):
// skill_trees / skills / user_skills. F23 fixed the previously fictional
// skill_nodes + wrong user_skills column names.
interface Skill {
  id: string
  name: string
  description: string | null
  level: number
  xp_required: number
  prerequisites: string[]
}

interface SkillTree {
  id: string
  name: string
  description: string | null
  skills: Skill[]
}

interface UserSkill {
  skill_id: string
  current_xp: number
  mastery_level: number
  unlocked: boolean
}

interface SkillTreeViewProps {
  skillTrees: SkillTree[]
  userSkills: UserSkill[]
  userId: string
}

export function SkillTreeView({ skillTrees, userSkills, userId }: SkillTreeViewProps) {
  const [selectedTree, setSelectedTree] = useState<SkillTree | null>(skillTrees[0] || null)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const router = useRouter()

  const isSkillUnlocked = (skillId: string) => {
    return userSkills.some((s) => s.skill_id === skillId && s.unlocked)
  }

  const getSkillMastery = (skillId: string) => {
    return userSkills.find((s) => s.skill_id === skillId)?.mastery_level || 0
  }

  const getSkillXP = (skillId: string) => {
    return userSkills.find((s) => s.skill_id === skillId)?.current_xp || 0
  }

  const canUnlockSkill = (skill: Skill) => {
    if (isSkillUnlocked(skill.id)) return false
    if (!skill.prerequisites || skill.prerequisites.length === 0) return true
    return skill.prerequisites.every((prereqId) => isSkillUnlocked(prereqId))
  }

  const totalXP = userSkills.reduce((sum, skill) => sum + (skill.current_xp || 0), 0)

  const unlockSkill = async (skill: Skill) => {
    if (unlockingId) return
    setUnlockingId(skill.id)
    try {
      const res = await fetch(`/api/learn/skills/${skill.id}/unlock`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Unlock failed")
      toast.success(`Unlocked ${skill.name}`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unlock skill")
    } finally {
      setUnlockingId(null)
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Skill Tree</h1>
              <p className="text-muted-foreground">Master skills and unlock new abilities</p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#e052a0]/10 to-[#00c9c8]/10 rounded-full px-4 py-2">
              <Zap className="h-5 w-5 text-[#e052a0]" />
              <span className="font-bold">{totalXP.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tree Selection */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-foreground">Skill Categories</h2>
            {skillTrees.map((tree) => (
              <Card
                key={tree.id}
                className={cn(
                  "cursor-pointer transition-all bg-white/5 backdrop-blur-md border-white/20 hover:border-white/30",
                  selectedTree?.id === tree.id && "ring-2 ring-[#e052a0] border-[#e052a0]/50",
                )}
                onClick={() => setSelectedTree(tree)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{tree.name}</h3>
                      <p className="text-xs text-muted-foreground">{tree.skills?.length || 0} skills</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {skillTrees.length === 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No skill trees available yet</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Skill Nodes */}
          <div className="lg:col-span-3">
            {selectedTree ? (
              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle>{selectedTree.name}</CardTitle>
                  <CardDescription>{selectedTree.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...(selectedTree.skills ?? [])]
                      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                      .map((skill) => {
                        const unlocked = isSkillUnlocked(skill.id)
                        const mastery = getSkillMastery(skill.id)
                        const xp = getSkillXP(skill.id)
                        const canUnlock = canUnlockSkill(skill)

                        return (
                          <Card
                            key={skill.id}
                            className={cn(
                              "relative overflow-hidden transition-all bg-white/5 backdrop-blur-md border-white/20",
                              !unlocked && !canUnlock && "opacity-50",
                              unlocked && "ring-1 ring-green-500 border-green-500/30",
                            )}
                          >
                            {unlocked && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                            {!unlocked && !canUnlock && (
                              <div className="absolute top-2 right-2">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center",
                                    unlocked ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8]" : "bg-white/10",
                                  )}
                                >
                                  <Sparkles
                                    className={cn("h-6 w-6", unlocked ? "text-white" : "text-muted-foreground")}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{skill.name}</h3>
                                  <p className="text-xs text-muted-foreground">{skill.xp_required} XP required</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
                              {unlocked && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Mastery</span>
                                    <span>{mastery}/5</span>
                                  </div>
                                  <Progress value={(mastery / 5) * 100} className="h-2" />
                                  <p className="text-xs text-muted-foreground text-right">{xp} XP earned</p>
                                </div>
                              )}
                              {!unlocked && canUnlock && (
                                <Button
                                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                                  size="sm"
                                  disabled={unlockingId === skill.id}
                                  onClick={() => unlockSkill(skill)}
                                >
                                  {unlockingId === skill.id ? "Unlocking…" : "Unlock Skill"}
                                </Button>
                              )}
                              {!unlocked && !canUnlock && skill.prerequisites?.length > 0 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  Complete prerequisites to unlock
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                  {(!selectedTree.skills || selectedTree.skills.length === 0) && (
                    <div className="text-center py-12">
                      <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No skills in this category yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a skill category to view skills</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
