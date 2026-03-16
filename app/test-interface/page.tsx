"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestInterfacePage() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testTextGeneration = async () => {
    setIsLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          testMode: true,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let fullResponse = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          // Handle AI SDK UI format: 0:"content"
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2))
              if (content) {
                fullResponse += content
                setResponse(fullResponse)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
          // Also handle legacy SSE format: data: {"content": "..."}
          else if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullResponse += parsed.content
                setResponse(fullResponse)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testImageGeneration = async () => {
    setIsLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          style: "realistic",
          size: "1024x1024"
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`)
      }

      if (data.success && data.image?.url) {
        setResponse(`Image generated successfully!\n\nProvider: ${data.image.provider}\nSize: ${data.image.size}\nStyle: ${data.image.style}\n\nImage URL: ${data.image.url.substring(0, 100)}...`)
      } else {
        setResponse(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testCodeGeneration = async () => {
    setIsLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          type: "component", // Use valid generation type
          testMode: true,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }

      // Handle SSE stream response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let fullResponse = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullResponse += parsed.content
                setResponse(fullResponse)
              }
              if (parsed.complete && parsed.code) {
                setResponse(parsed.code)
              }
              if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testVideoGeneration = async () => {
    setIsLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`)
      }

      if (data.success && data.video?.url) {
        setResponse(`Video generated successfully!\n\nProvider: ${data.video.provider}\nDuration: ${data.video.duration || 'N/A'}\n\nVideo URL: ${data.video.url.substring(0, 100)}...`)
      } else {
        setResponse(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testAudioGeneration = async () => {
    setIsLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt,
          voice: "en-US-Standard-A",
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`)
      }

      if (data.success && data.audio?.url) {
        setResponse(`Audio generated successfully!\n\nProvider: ${data.audio.provider}\nVoice: ${data.audio.voice || 'N/A'}\n\nAudio URL: ${data.audio.url.substring(0, 100)}...`)
      } else {
        setResponse(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent">
          Nairi Test Interface (No Auth Required)
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Generation Testing</CardTitle>
            <CardDescription>Test all AI generation features without authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your test prompt here..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={testTextGeneration} disabled={isLoading || !prompt}>
                Test Text Generation
              </Button>
              <Button onClick={testCodeGeneration} disabled={isLoading || !prompt} variant="secondary">
                Test Code Generation
              </Button>
              <Button onClick={testImageGeneration} disabled={isLoading || !prompt} variant="outline">
                Test Image Generation
              </Button>
              <Button onClick={testVideoGeneration} disabled={isLoading || !prompt} variant="outline">
                Test Video Generation
              </Button>
              <Button onClick={testAudioGeneration} disabled={isLoading || !prompt} variant="outline">
                Test Audio Generation
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">Loading...</p>
              </div>
            )}

            {response && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Response:</p>
                <pre className="text-sm whitespace-pre-wrap">{response}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
