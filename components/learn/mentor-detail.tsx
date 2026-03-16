"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageCircle, Calendar, BookOpen } from "lucide-react"

type Mentor = {
  id: string
  domain: string
  mentor_name: string
  mentor_personality: string | null
  progress_notes: string | null
  interaction_count: number
  last_interaction: string | null
  teaching_preferences: Record<string, unknown>
}

interface MentorDetailProps {
  mentor: Mentor
  userId: string
}

export function MentorDetail({ mentor, userId }: MentorDetailProps) {
  const [notes, setNotes] = useState(mentor.progress_notes ?? "")
  const [saving, setSaving] = useState(false)
  const [interactionRecorded, setInteractionRecorded] = useState(false)

  const recordInteraction = useCallback(async () => {
    if (interactionRecorded) return
    setSaving(true)
    try {
      await fetch(`/api/learn/ai-mentors/${encodeURIComponent(mentor.domain)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "interaction" }),
      })
      setInteractionRecorded(true)
    } finally {
      setSaving(false)
    }
  }, [mentor.domain, interactionRecorded])

  const saveProgressNotes = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/learn/ai-mentors/${encodeURIComponent(mentor.domain)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress_notes", progress_notes: notes }),
      })
    } finally {
      setSaving(false)
    }
  }, [mentor.domain, notes])

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{mentor.mentor_name}</CardTitle>
              <Badge variant="secondary" className="mt-2">
                {mentor.domain.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
          {mentor.mentor_personality && (
            <p className="text-muted-foreground">{mentor.mentor_personality}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {mentor.interaction_count} interactions
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Last: {mentor.last_interaction ? new Date(mentor.last_interaction).toLocaleDateString() : "Never"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this mentor in chat or during lessons to get personalized help. Your progress and preferences are saved here.
          </p>
          <Button
            onClick={recordInteraction}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {interactionRecorded ? "Interaction recorded" : "Record a session"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle className="text-lg">Progress notes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Notes for you or your mentor. You can paste AI-generated summaries here.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What you've covered, weak points, next goals…"
            rows={5}
            className="bg-white/5"
          />
          <Button
            onClick={saveProgressNotes}
            disabled={saving}
            className="mt-3"
          >
            {saving ? "Saving…" : "Save notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
