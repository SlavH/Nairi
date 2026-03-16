"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, Plus, MessageSquare, Users, ThumbsUp, ThumbsDown, Loader2, ChevronRight, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface DebateSession {
  id: string
  topic: string
  status: "active" | "concluded"
  user_stance: string
  ai_perspectives: string[]
  conclusion: string | null
  created_at: string
}

interface DebateInterfaceProps {
  sessions: DebateSession[]
  userId: string
}

export function DebateInterface({ sessions: initialSessions, userId }: DebateInterfaceProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [activeSession, setActiveSession] = useState<DebateSession | null>(null)
  const [topic, setTopic] = useState("")
  const [userStance, setUserStance] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [debateMessages, setDebateMessages] = useState<
    { role: "user" | "ai"; content: string; perspective?: string }[]
  >([])
  const [newArgument, setNewArgument] = useState("")
  const [isThinking, setIsThinking] = useState(false)

  const supabase = createClient()

  const handleStartDebate = async () => {
    if (!topic.trim()) return

    setIsCreating(true)

    const { data, error } = await supabase
      .from("debate_sessions")
      .insert({
        user_id: userId,
        topic: topic.trim(),
        status: "active",
        user_stance: userStance.trim() || null,
        ai_perspectives: ["For", "Against", "Neutral"],
      })
      .select()
      .single()

    if (!error && data) {
      setSessions([data, ...sessions])
      setActiveSession(data)
      setTopic("")
      setUserStance("")

      // Generate initial AI perspectives using chat API
      setIsThinking(true)
      try {
        const debatePrompt = userStance.trim()
          ? `Topic: "${data.topic}"\n\nUser's initial stance: ${userStance.trim()}\n\nPlease present multiple perspectives on this topic (For, Against, and Neutral) to help explore different viewpoints.`
          : `Topic: "${data.topic}"\n\nPlease present multiple perspectives on this topic (For, Against, and Neutral) to help explore different viewpoints.`

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: debatePrompt }],
            mode: 'debate',
          }),
        })

        if (response.ok && response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let fullContent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.content) {
                    fullContent += data.content
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          const aiResponse = fullContent

          if (aiResponse) {
            setDebateMessages([
              {
                role: "ai",
                content: aiResponse,
                perspective: "Moderator",
              },
            ])

            // Save initial AI argument to database
            await supabase.from("debate_arguments").insert({
              session_id: data.id,
              role: "ai",
              content: aiResponse,
              argument_type: "claim",
              round_number: 1,
            })
          }
        }
      } catch (error) {
        console.error('Failed to generate debate perspectives:', error)
        // Fallback to a simple message
        setDebateMessages([
          {
            role: "ai",
            content: `Let's explore the topic: "${data.topic}". I'll help you think through different perspectives on this issue.`,
            perspective: "Moderator",
          },
        ])
      }
      setIsThinking(false)
    }

    setIsCreating(false)
  }

  const handleSubmitArgument = async () => {
    if (!newArgument.trim() || !activeSession) return

    const userMessage = { role: "user" as const, content: newArgument }
    setDebateMessages([...debateMessages, userMessage])
    setNewArgument("")

    // Save user argument to database
    const { data: userArg } = await supabase.from("debate_arguments").insert({
      session_id: activeSession.id,
      role: "user",
      content: newArgument,
      argument_type: "claim",
      round_number: debateMessages.filter(m => m.role === "user").length + 1,
    }).select().single()

    // Generate AI response using chat API
    setIsThinking(true)
    try {
      const debateContext = `We're debating: "${activeSession.topic}"${activeSession.user_stance ? `\nUser's stance: ${activeSession.user_stance}` : ''}\n\nPrevious arguments:\n${debateMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser's new argument: ${newArgument}\n\nPlease respond with a thoughtful counter-argument or supporting perspective, considering multiple viewpoints.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: debateContext }],
          mode: 'debate',
        }),
      })

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        const aiResponse = fullContent

        if (aiResponse) {
          setDebateMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content: aiResponse,
              perspective: "Analysis",
            },
          ])

          // Save AI argument to database
          await supabase.from("debate_arguments").insert({
            session_id: activeSession.id,
            role: "ai",
            content: aiResponse,
            argument_type: "rebuttal",
            round_number: debateMessages.filter(m => m.role === "user").length + 1,
          })

          // Update session round count
          await supabase
            .from("debate_sessions")
            .update({ total_rounds: debateMessages.filter(m => m.role === "user").length + 1 })
            .eq("id", activeSession.id)
        }
      }
    } catch (error) {
      console.error('Failed to generate debate response:', error)
      // Fallback message
      setDebateMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "That's an interesting point. Let me think about this from multiple perspectives...",
          perspective: "Analysis",
        },
      ])
    }
    setIsThinking(false)
  }

  const handleConcludeDebate = async () => {
    if (!activeSession) return

    setIsThinking(true)

    try {
      // Generate conclusion using chat API
      const conclusionPrompt = `We've been debating: "${activeSession.topic}"${activeSession.user_stance ? `\nUser's stance: ${activeSession.user_stance}` : ''}\n\nAll arguments discussed:\n${debateMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nPlease provide a thoughtful conclusion summarizing the key arguments, different perspectives explored, and potential synthesis or areas for further exploration.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: conclusionPrompt }],
          mode: 'debate',
        }),
      })

      let conclusion = `Based on our discussion about "${activeSession.topic}", here are the key takeaways:\n\n1. **Main arguments explored:** We've discussed multiple perspectives...\n2. **Synthesis:** A balanced view considers...\n3. **Areas for further exploration:** This topic connects to...`

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        const aiConclusion = fullContent

        if (aiConclusion) {
          conclusion = aiConclusion
        }
      }

      await supabase.from("debate_sessions").update({ 
        status: "concluded", 
        conclusion,
        completed_at: new Date().toISOString()
      }).eq("id", activeSession.id)

      setDebateMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: conclusion,
          perspective: "Conclusion",
        },
      ])

      setActiveSession({ ...activeSession, status: "concluded", conclusion })
    } catch (error) {
      console.error('Failed to generate conclusion:', error)
      // Fallback conclusion
      const fallbackConclusion = `Based on our discussion about "${activeSession.topic}", we've explored multiple perspectives. Consider reviewing the arguments above to form your own conclusion.`
      setDebateMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: fallbackConclusion,
          perspective: "Conclusion",
        },
      ])
    }
    setIsThinking(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Debate Mode</h1>
              <p className="text-muted-foreground">Explore ideas from multiple perspectives</p>
            </div>
            {activeSession && (
              <Button variant="outline" onClick={() => setActiveSession(null)} className="bg-transparent">
                New Debate
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!activeSession ? (
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="new">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="new" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Debate
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Start a New Debate
                    </CardTitle>
                    <CardDescription>
                      Enter a topic and optionally your initial stance. Nairi will present multiple perspectives to help
                      you think critically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic to Debate</label>
                      <Input
                        placeholder="e.g., Should AI be used in education?"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Initial Stance (Optional)</label>
                      <Textarea
                        placeholder="Share your current position on this topic..."
                        value={userStance}
                        onChange={(e) => setUserStance(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button
                      onClick={handleStartDebate}
                      disabled={!topic.trim() || isCreating}
                      className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Scale className="h-4 w-4 mr-2" />
                          Start Debate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Suggested Topics */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Is remote work better than office work?",
                        "Should social media be regulated?",
                        "Is space exploration worth the cost?",
                        "Should AI art be considered real art?",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          className="justify-start h-auto py-3 px-4 text-left bg-transparent"
                          onClick={() => setTopic(suggestion)}
                        >
                          <ChevronRight className="h-4 w-4 mr-2 shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setActiveSession(session)
                        setDebateMessages([])
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Scale className="h-4 w-4 text-muted-foreground" />
                              <Badge variant={session.status === "active" ? "default" : "secondary"}>
                                {session.status}
                              </Badge>
                            </div>
                            <h3 className="font-medium">{session.topic}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {sessions.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No debates yet</h3>
                        <p className="text-muted-foreground">Start your first debate to explore ideas!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Active Debate */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={activeSession.status === "active" ? "default" : "secondary"} className="mb-2">
                      {activeSession.status}
                    </Badge>
                    <CardTitle>{activeSession.topic}</CardTitle>
                    {activeSession.user_stance && (
                      <CardDescription className="mt-2">Your stance: {activeSession.user_stance}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeSession.ai_perspectives.map((perspective) => (
                      <Badge key={perspective} variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {perspective}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Debate Messages */}
            <div className="space-y-4 mb-6">
              {debateMessages.map((message, index) => (
                <Card key={index} className={cn(message.role === "user" && "ml-12 bg-muted/50")}>
                  <CardContent className="p-4">
                    {message.perspective && (
                      <Badge variant="outline" className="mb-2">
                        {message.perspective}
                      </Badge>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "ai" && (
                      <div className="flex items-center gap-2 mt-4">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ThumbsDown className="h-4 w-4" />
                          Not helpful
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {isThinking && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Analyzing perspectives...</span>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Input */}
            {activeSession.status === "active" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Textarea
                      placeholder="Share your argument or ask a question..."
                      value={newArgument}
                      onChange={(e) => setNewArgument(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={handleConcludeDebate}
                      disabled={isThinking}
                      className="bg-transparent"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Conclude Debate
                    </Button>
                    <Button
                      onClick={handleSubmitArgument}
                      disabled={!newArgument.trim() || isThinking}
                      className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                    >
                      Submit Argument
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
