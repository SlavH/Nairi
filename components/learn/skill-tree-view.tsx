"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, Lock, CheckCircle2, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SkillNode {
  id: string
  name: string
  description: string
  icon: string
  xp_required: number
  prerequisites: string[]
  order_index: number
}

interface SkillTree {
  id: string
  name: string
  description: string
  icon: string
  skill_nodes: SkillNode[]
}

interface UserSkill {
  skill_node_id: string
  proficiency_level: number
  xp_earned: number
  unlocked: boolean
}

interface SkillTreeViewProps {
  skillTrees: SkillTree[]
  userSkills: UserSkill[]
  userId: string
}

export function SkillTreeView({ skillTrees, userSkills, userId }: SkillTreeViewProps) {
  const [selectedTree, setSelectedTree] = useState<SkillTree | null>(skillTrees[0] || null)

  const isSkillUnlocked = (skillId: string) => {
    return userSkills.some((s) => s.skill_node_id === skillId && s.unlocked)
  }

  const getSkillProgress = (skillId: string) => {
    return userSkills.find((s) => s.skill_node_id === skillId)?.proficiency_level || 0
  }

  const getSkillXP = (skillId: string) => {
    return userSkills.find((s) => s.skill_node_id === skillId)?.xp_earned || 0
  }

  const canUnlockSkill = (skill: SkillNode) => {
    if (isSkillUnlocked(skill.id)) return false
    if (!skill.prerequisites || skill.prerequisites.length === 0) return true
    return skill.prerequisites.every((prereqId) => isSkillUnlocked(prereqId))
  }

  const totalXP = userSkills.reduce((sum, skill) => sum + skill.xp_earned, 0)

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
                      <p className="text-xs text-muted-foreground">{tree.skill_nodes?.length || 0} skills</p>
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
                    {selectedTree.skill_nodes
                      ?.sort((a, b) => a.order_index - b.order_index)
                      .map((skill) => {
                        const unlocked = isSkillUnlocked(skill.id)
                        const progress = getSkillProgress(skill.id)
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
                                    <span>Proficiency</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  <p className="text-xs text-muted-foreground text-right">{xp} XP earned</p>
                                </div>
                              )}
                              {!unlocked && canUnlock && (
                                <Button
                                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                                  size="sm"
                                >
                                  Unlock Skill
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
                  {(!selectedTree.skill_nodes || selectedTree.skill_nodes.length === 0) && (
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
