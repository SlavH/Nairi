import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

export const maxDuration = 60

interface CodeAgentRequest {
  prompt: string
  code?: string
  language?: string
  action?: "explain" | "fix" | "refactor" | "tests" | "general"
}

// System prompts for different code agent actions
const CODE_AGENT_PROMPTS: Record<string, string> = {
  explain: `You are an expert code explainer. Analyze the provided code and explain it in a clear, educational manner.

RESPONSE FORMAT:
1. Overview - Brief summary of what the code does
2. Key Concepts - Important programming concepts used
3. Line-by-Line Breakdown - Explain significant sections
4. Potential Improvements - Suggestions for better code

Be concise but thorough. Use simple language for beginners.`,

  fix: `You are an expert debugging assistant. Analyze the provided code to find and fix bugs.

RESPONSE FORMAT:
1. Issue Identification - Describe the bugs found
2. Root Cause - Explain why the bug occurs
3. Fix - Provide the corrected code
4. Prevention - Tips to avoid similar bugs

Return code changes in this format:
\`\`\`diff
- old code line
+ new code line
\`\`\``,

  refactor: `You are an expert code refactoring assistant. Improve the code quality while maintaining functionality.

FOCUS ON:
- Clean code principles
- DRY (Don't Repeat Yourself)
- SOLID principles where applicable
- Better naming conventions
- Performance improvements
- Error handling
- Type safety

Return the refactored code with explanations of changes made.`,

  tests: `You are an expert test writer. Generate comprehensive tests for the provided code.

GENERATE:
- Unit tests for individual functions
- Edge case tests
- Error handling tests
- Integration tests if applicable

Use appropriate testing framework syntax (Jest/Vitest for TypeScript/JavaScript).
Include setup and teardown if needed.`,

  general: `You are an expert AI coding assistant. Help the user with their coding request.

CAPABILITIES:
- Write new code from descriptions
- Explain code and concepts
- Debug and fix issues
- Refactor and optimize
- Generate tests
- Answer programming questions

Be helpful, accurate, and provide working code examples.
Use markdown code blocks with language tags.`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body: CodeAgentRequest = await req.json()
    const { prompt, code, language = "typescript", action = "general" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Test mode bypass - only enabled with explicit env var
    const testMode = process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true'

    // Build the system prompt
    const systemPrompt = CODE_AGENT_PROMPTS[action] || CODE_AGENT_PROMPTS.general

    // Build user message
    let userMessage = prompt
    if (code) {
      userMessage = `${prompt}\n\n\`\`\`${language}\n${code}\n\`\`\``
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "Analyzing..." })}\n\n`))

          const { text: fullContent } = await generateWithFallback({
            system: systemPrompt,
            prompt: userMessage,
            maxOutputTokens: 4096,
            temperature: 0.3,
          })

          // Extract code changes from the response
          const codeChanges = extractCodeChanges(fullContent)

          // Send content + final complete response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: fullContent })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            complete: true, 
            fullContent,
            codeChanges
          })}\n\n`))

          // Save to database (non-blocking) - only if user is logged in
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "code-agent",
              prompt,
              content: fullContent,
              options: { language, action, hasCode: !!code },
              metadata: { 
                codeChangesCount: codeChanges.length,
                action
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : "Code agent failed" 
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Code agent error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Code agent failed" },
      { status: 500 }
    )
  }
}

// Extract code changes from AI response
function extractCodeChanges(content: string): Array<{
  type: 'add' | 'modify' | 'delete'
  description: string
  diff: string
}> {
  const changes: Array<{
    type: 'add' | 'modify' | 'delete'
    description: string
    diff: string
  }> = []
  
  // Look for diff blocks
  const diffRegex = /```diff\n([\s\S]*?)```/g
  let match
  
  while ((match = diffRegex.exec(content)) !== null) {
    const diffContent = match[1]
    const hasAdditions = diffContent.includes('\n+')
    const hasDeletions = diffContent.includes('\n-')
    
    changes.push({
      type: hasAdditions && hasDeletions ? 'modify' : hasAdditions ? 'add' : 'delete',
      description: 'Code change detected',
      diff: diffContent.trim()
    })
  }
  
  // Look for regular code blocks that might be new code
  const codeRegex = /```(?:typescript|javascript|tsx|jsx|python|java|go|rust)?\n([\s\S]*?)```/g
  
  while ((match = codeRegex.exec(content)) !== null) {
    // Only add if not already captured as diff
    if (!match[0].startsWith('```diff')) {
      changes.push({
        type: 'add',
        description: 'New code suggestion',
        diff: match[1].trim()
      })
    }
  }
  
  return changes
}
