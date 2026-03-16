"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, FileText, Brain, Sparkles, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface CreatePostProps {
  userId: string
}

export function CreatePost({ userId }: CreatePostProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contentType, setContentType] = useState<"text" | "publication" | "ai_generated">("text")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleGenerateAI = async () => {
    if (!title.trim()) return
    setIsGenerating(true)
    // Simulated AI generation - in production, this would call the AI API
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setContent(
      `This is AI-generated content based on your topic: "${title}"\n\nHere's an insightful exploration of the subject...`,
    )
    setIsGenerating(false)
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from("feed_posts").insert({
      user_id: userId,
      content_type: contentType,
      title: title.trim() || null,
      content: content.trim(),
      tags,
      is_published: true,
    })

    if (!error) {
      router.push("/flow")
      router.refresh()
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/flow"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Flow
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
          <p className="text-muted-foreground">Share your knowledge with the community</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>New Post</CardTitle>
              <CardDescription>Choose a content type and start creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="publication" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Publication
                  </TabsTrigger>
                  <TabsTrigger value="ai_generated" className="gap-2">
                    <Brain className="h-4 w-4" />
                    AI Assisted
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Give your post a title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      className="min-h-[200px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="publication" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pub-title">Title</Label>
                    <Input
                      id="pub-title"
                      placeholder="Publication title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pub-content">Content</Label>
                    <Textarea
                      id="pub-content"
                      placeholder="Write your publication content... Markdown supported."
                      className="min-h-[300px] font-mono text-sm"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ai_generated" className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-title">Topic</Label>
                    <Input
                      id="ai-title"
                      placeholder="Enter a topic for AI to expand on..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleGenerateAI}
                    disabled={!title.trim() || isGenerating}
                    className="w-full gap-2 bg-transparent"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="ai-content">Generated Content</Label>
                    <Textarea
                      id="ai-content"
                      placeholder="AI-generated content will appear here. You can edit it."
                      className="min-h-[200px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag} className="bg-transparent">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link href="/flow">
                  <Button variant="outline" className="bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Publishing...
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
