"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Brain, TrendingUp, AlertTriangle, RefreshCw, Calendar, Sparkles, ChevronRight } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"

interface MemoryItem {
  id: string
  topic: string
  content: string
  learnedAt: Date
  lastReviewed: Date | null
  strength: number // 0-100, decays over time
  reviewCount: number
  category: string
}

interface BeliefEvolution {
  id: string
  topic: string
  oldBelief: string
  currentBelief: string
  changedAt: Date
  reason?: string
}

interface TemporalMemoryProps {
  memories: MemoryItem[]
  evolutions: BeliefEvolution[]
  onReview: (memoryId: string) => void
  onExploreChange: (evolutionId: string) => void
}

export function TemporalMemory({ memories, evolutions, onReview, onExploreChange }: TemporalMemoryProps) {
  const [activeTab, setActiveTab] = useState("weak")

  // Filter memories by strength
  const weakMemories = memories.filter((m) => m.strength < 40).sort((a, b) => a.strength - b.strength)
  const forgottenMemories = memories.filter((m) => m.strength < 20)
  const strongMemories = memories.filter((m) => m.strength >= 70)

  const getStrengthColor = (strength: number) => {
    if (strength >= 70) return "text-green-500"
    if (strength >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  const getStrengthBg = (strength: number) => {
    if (strength >= 70) return "bg-green-500"
    if (strength >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#e052a0]/10 to-[#00c9c8]/10 border-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Memories</p>
                <p className="text-2xl font-bold">{memories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Strong Memories</p>
                <p className="text-2xl font-bold">{strongMemories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Need Review</p>
                <p className="text-2xl font-bold">{weakMemories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Belief Changes</p>
                <p className="text-2xl font-bold">{evolutions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weak" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            Needs Review ({weakMemories.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1">
            <Brain className="h-4 w-4" />
            All Memories
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            Your Evolution
          </TabsTrigger>
        </TabsList>

        {/* Weak Memories - Need Review */}
        <TabsContent value="weak" className="space-y-4 mt-6">
          {weakMemories.length > 0 ? (
            <>
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Clock className="h-5 w-5" />
                    <p className="font-medium">
                      {forgottenMemories.length} topic{forgottenMemories.length !== 1 ? "s" : ""} are fading from
                      memory. Review now to reinforce!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {weakMemories.map((memory) => (
                  <Card key={memory.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{memory.topic}</h3>
                            <Badge variant="outline" className="text-xs">
                              {memory.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{memory.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Learned {formatDistanceToNow(memory.learnedAt, { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" />
                              {memory.reviewCount} reviews
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Memory Strength</p>
                            <p className={cn("text-lg font-bold", getStrengthColor(memory.strength))}>
                              {memory.strength}%
                            </p>
                          </div>
                          <Progress
                            value={memory.strength}
                            className={cn("w-20 h-2", getStrengthBg(memory.strength))}
                          />
                          <Button
                            size="sm"
                            onClick={() => onReview(memory.id)}
                            className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
                          >
                            Review Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
                <p className="text-muted-foreground">All your memories are strong. Keep learning!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Memories */}
        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-3">
            {memories
              .sort((a, b) => b.learnedAt.getTime() - a.learnedAt.getTime())
              .map((memory) => (
                <Card key={memory.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            memory.strength >= 70
                              ? "bg-green-500"
                              : memory.strength >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500",
                          )}
                        />
                        <div>
                          <h4 className="font-medium">{memory.topic}</h4>
                          <p className="text-xs text-muted-foreground">{memory.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("font-medium", getStrengthColor(memory.strength))}>{memory.strength}%</span>
                        <Button variant="ghost" size="sm" onClick={() => onReview(memory.id)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Belief Evolution - "You Changed" Detection */}
        <TabsContent value="evolution" className="space-y-4 mt-6">
          <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Your Evolution Over Time
              </CardTitle>
              <CardDescription>Track how your understanding, opinions, and skills have evolved</CardDescription>
            </CardHeader>
          </Card>

          {evolutions.length > 0 ? (
            <div className="space-y-4">
              {evolutions.map((evolution) => (
                <Card key={evolution.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2">
                      {/* Old Belief */}
                      <div className="p-4 bg-red-500/5 border-r border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-red-500 border-red-500/30">
                            Before
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(evolution.changedAt, "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm">{evolution.oldBelief}</p>
                      </div>

                      {/* Current Belief */}
                      <div className="p-4 bg-green-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-green-500 border-green-500/30">
                            Now
                          </Badge>
                        </div>
                        <p className="text-sm">{evolution.currentBelief}</p>
                      </div>
                    </div>

                    {evolution.reason && (
                      <div className="px-4 py-3 bg-muted/30 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">What changed:</span> {evolution.reason}
                        </p>
                      </div>
                    )}

                    <div className="px-4 py-2 border-t border-border flex justify-between items-center">
                      <span className="font-medium text-sm">{evolution.topic}</span>
                      <Button variant="ghost" size="sm" onClick={() => onExploreChange(evolution.id)}>
                        Explore This Change
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Your journey begins</h3>
                <p className="text-muted-foreground">
                  As you learn and grow, we'll track how your understanding evolves
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
