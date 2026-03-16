"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, BookOpen, Calendar } from "lucide-react"

type Mentor = {
  id: string
  domain: string
  mentor_name: string
  mentor_personality: string | null
  interaction_count: number
  last_interaction: string | null
  created_at: string
}

interface AIMentorsListProps {
  mentors: Mentor[]
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never"
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return "Just now"
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString()
}

export function AIMentorsList({ mentors }: AIMentorsListProps) {
  if (mentors.length === 0) {
    return (
      <Card className="bg-white/5 border-white/20">
        <CardContent className="py-12 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No mentors yet. Add one to get started.</p>
          <Link
            href="/learn/mentors/new"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Create your first mentor →
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {mentors.map((m) => (
        <Link key={m.id} href={`/learn/mentors/${encodeURIComponent(m.domain)}`}>
          <Card className="bg-white/5 border-white/20 hover:bg-white/10 transition-colors h-full">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{m.mentor_name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {m.domain.replace(/_/g, " ")}
                  </Badge>
                </div>
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {m.mentor_personality && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {m.mentor_personality}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {m.interaction_count} interactions
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(m.last_interaction)}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
