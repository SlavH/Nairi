import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { streamWithFallback } from "@/lib/ai/groq-direct"

export const maxDuration = 300

interface ProjectGenerateRequest {
  prompt: string
  projectType: "website" | "webapp" | "saas" | "portfolio" | "ecommerce" | "blog"
  pages?: string[]
  features?: string[]
}

interface GeneratedFile {
  path: string
  content: string
  type: "page" | "component" | "layout" | "api" | "lib" | "style"
}

// System prompt for multi-file project generation
const PROJECT_GENERATION_PROMPT = `You are an expert Next.js developer. Generate a complete multi-page project.

OUTPUT FORMAT: You must return a JSON array of files. Each file object has:
- "path": file path relative to project root (e.g., "app/page.tsx")
- "content": the full file content as a string
- "type": one of "page", "component", "layout", "api", "lib", "style"

IMPORTANT RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. Start with [ and end with ]
3. Each file must be complete and runnable
4. Use "use client" directive for client components
5. Use Tailwind CSS for all styling
6. Create reusable components in components/ folder
7. Follow Next.js 14+ App Router conventions

FILE STRUCTURE TO GENERATE:
- app/page.tsx (home page)
- app/layout.tsx (root layout with metadata)
- app/globals.css (Tailwind imports and custom styles)
- components/*.tsx (reusable components)
- Additional pages as needed

REACT PATTERNS:
- Functional components with hooks
- TypeScript with inline types
- Proper error boundaries
- Loading states
- Responsive design

Example output format:
[
  {
    "path": "app/page.tsx",
    "content": "export default function Home() { return <main>...</main> }",
    "type": "page"
  },
  {
    "path": "components/Header.tsx",
    "content": "export function Header() { return <header>...</header> }",
    "type": "component"
  }
]`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ProjectGenerateRequest = await req.json()
    const { prompt, projectType, pages, features } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Build the user prompt
    const userPrompt = buildProjectPrompt(prompt, projectType, pages, features)

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream progress updates
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: "generating",
                message: "AI is generating your project...",
              })}\n\n`
            )
          )

          const result = await streamWithFallback({
            system: PROJECT_GENERATION_PROMPT,
            prompt: userPrompt,
            abortSignal: req.signal,
            maxOutputTokens: 16000,
            temperature: 0.7,
          })

          let fullContent = ""
          const provider = "bitnet"
          const model = process.env.BITNET_MODEL || "bitnet-b1.58-2b"

          for await (const chunk of result.textStream) {
            fullContent += chunk
            // Send progress
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  status: "streaming",
                  progress: Math.min(90, fullContent.length / 100),
                })}\n\n`
              )
            )
          }

          // Parse the generated files
          let files: GeneratedFile[] = []
          try {
            // Extract JSON from response (handle markdown code blocks)
            let jsonContent = fullContent.trim()
            if (jsonContent.startsWith("```")) {
              jsonContent = jsonContent.replace(/```(?:json)?\n?/g, "").replace(/```\n?$/g, "")
            }

            // Find the JSON array
            const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              files = JSON.parse(jsonMatch[0])
            } else {
              throw new Error("No valid JSON array found in response")
            }
          } catch {
            // If JSON parsing fails, create a single-file fallback
            files = [
              {
                path: "app/page.tsx",
                content: generateFallbackPage(fullContent),
                type: "page",
              },
            ]
          }

          // Validate and clean files
          files = files.map((file) => ({
            ...file,
            content: cleanFileContent(file.content, file.path),
          }))

          // Send complete response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: "complete",
                files,
                provider,
                model,
                fileCount: files.length,
              })}\n\n`
            )
          )

          // Save to database (non-blocking)
          Promise.resolve(supabase
            .from("creations")
            .insert({
              user_id: user.id,
              type: `project-${projectType}`,
              prompt,
              content: JSON.stringify(files),
              options: { projectType, pages, features },
              metadata: { provider, model, fileCount: files.length },
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: "error",
                error: error instanceof Error ? error.message : "Generation failed",
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Project generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 })
  }
}

function buildProjectPrompt(prompt: string, projectType: string, pages?: string[], features?: string[]): string {
  let fullPrompt = `Create a complete ${projectType} project: ${prompt}`

  if (pages?.length) {
    fullPrompt += `\n\nRequired pages:\n${pages.map((p) => `- ${p}`).join("\n")}`
  }

  if (features?.length) {
    fullPrompt += `\n\nRequired features:\n${features.map((f) => `- ${f}`).join("\n")}`
  }

  const projectTemplates: Record<string, string> = {
    website: "Include: home, about, contact pages with navigation and footer",
    webapp: "Include: dashboard, settings, profile pages with sidebar navigation",
    saas: "Include: landing page, features, pricing, login/signup, dashboard",
    portfolio: "Include: home with hero, projects gallery, about, contact",
    ecommerce: "Include: product listing, product detail, cart, checkout",
    blog: "Include: home with posts, individual post page, categories, search",
  }

  if (projectTemplates[projectType]) {
    fullPrompt += `\n\nProject template: ${projectTemplates[projectType]}`
  }

  return fullPrompt
}

function cleanFileContent(content: string, path: string): string {
  // Remove escaped newlines and quotes from JSON
  let cleaned = content.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\")

  // Add "use client" for client components if needed
  if (path.includes("components/") || (path.includes("app/") && !path.includes("layout"))) {
    if (cleaned.includes("useState") || cleaned.includes("useEffect") || cleaned.includes("onClick")) {
      if (!cleaned.includes('"use client"') && !cleaned.includes("'use client'")) {
        cleaned = '"use client"\n\n' + cleaned
      }
    }
  }

  return cleaned
}

function generateFallbackPage(content: string): string {
  // If we couldn't parse the JSON, create a simple page with the content
  return `"use client"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Generated Content</h1>
        <div className="prose prose-invert">
          <pre className="whitespace-pre-wrap text-sm">{${JSON.stringify(content.slice(0, 2000))}}</pre>
        </div>
      </div>
    </main>
  )
}`
}
