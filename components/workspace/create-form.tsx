"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface CreateTypeOption {
  id: string
  label: string
  description: string
  accent?: boolean
}

interface CreateFormProps {
  type: CreateTypeOption
  onBack: () => void
}

export function CreateForm({ type, onBack }: CreateFormProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || submitting) return

    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.id, prompt: prompt.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Creation failed")
        return
      }

      toast.success("Creation generated")
      if (data.creationId) {
        router.push(`/workspace/${data.creationId}`)
        return
      }
      setResult(data.content || "Generation completed.")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground capitalize">{type.label}</CardTitle>
          <CardDescription>{type.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your project in detail..."
              maxLength={2000}
              className="w-full h-32 p-4 rounded-lg border border-border bg-background/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#e879f9]/50"
              required
            />
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" onClick={onBack} disabled={submitting} className="bg-transparent">
                Choose Different Type
              </Button>
              <Button type="submit" disabled={submitting || !prompt.trim()} className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </form>
          {result && (
            <pre className="whitespace-pre-wrap max-h-96 overflow-auto p-4 rounded-lg border border-border bg-background/70 text-sm text-foreground">{result}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
