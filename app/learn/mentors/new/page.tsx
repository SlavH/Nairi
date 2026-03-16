"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const SUGGESTED_DOMAINS = [
  "programming",
  "mathematics",
  "writing",
  "data_science",
  "design",
  "research",
  "languages",
  "physics",
]

export default function NewMentorPage() {
  const router = useRouter()
  const [domain, setDomain] = useState("")
  const [mentorName, setMentorName] = useState("")
  const [personality, setPersonality] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const d = (domain || "").trim().toLowerCase().replace(/\s+/g, "_")
    if (!d) {
      setError("Enter a subject/domain")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/learn/ai-mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: d,
          mentorName: mentorName.trim() || undefined,
          personality: personality.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Failed to create mentor")
      router.push(`/learn/mentors/${encodeURIComponent(d)}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Link
        href="/learn/mentors"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Mentors
      </Link>
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle>Create AI Mentor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a subject. Your mentor will adapt to your level and goals over time.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="domain">Subject / domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. programming, mathematics"
                className="mt-1"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED_DOMAINS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDomain(d)}
                    className="text-xs rounded-full border border-white/20 px-2 py-1 hover:bg-white/10"
                  >
                    {d.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Mentor name (optional)</Label>
              <Input
                id="name"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="e.g. Code Coach"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="personality">Teaching style (optional)</Label>
              <Textarea
                id="personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="e.g. Patient, uses examples, Socratic method"
                rows={3}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create mentor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
