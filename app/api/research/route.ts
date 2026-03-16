import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { streamWithFallback } from "@/lib/ai/groq-direct"

export const maxDuration = 120

interface ResearchRequest {
  query: string
  depth?: "quick" | "standard" | "deep"
}

const RESEARCH_SYSTEM_PROMPT = `You are a deep research assistant. Your task is to provide comprehensive, well-researched answers to questions.

RESEARCH APPROACH:
1. Break down the query into key aspects
2. Consider multiple perspectives and sources of information
3. Identify relevant facts, statistics, and expert opinions
4. Synthesize information into a coherent response
5. Highlight key findings and actionable insights

OUTPUT FORMAT:
Structure your response as:

## Summary
[Brief overview of findings]

## Key Findings
- Finding 1 with supporting evidence
- Finding 2 with supporting evidence
- Finding 3 with supporting evidence

## Detailed Analysis
[In-depth exploration of the topic]

## Recommendations
[Actionable suggestions based on research]

## Related Questions to Explore
- Question 1
- Question 2
- Question 3

Be thorough, accurate, and cite reasoning where applicable.`

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimitResult = checkRateLimit(`research:${clientId}`, RATE_LIMITS.generate)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body: ResearchRequest = await req.json()
    const { query, depth = "standard" } = body

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Adjust parameters based on depth
    const maxTokens = depth === "deep" ? 8000 : depth === "quick" ? 1500 : 4000
    const temperature = depth === "deep" ? 0.5 : 0.7

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            step: "analyzing",
            message: "Analyzing your query..."
          })}\n\n`))

          let fullContent = ""

          // Send researching status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "status", 
            step: "researching",
            message: "Conducting research..."
          })}\n\n`))

          // Use centralized Groq provider with streaming and model fallback
          const result = await streamWithFallback({
            system: RESEARCH_SYSTEM_PROMPT,
            prompt: `Research Query: ${query}\n\nResearch Depth: ${depth}\n\nProvide a comprehensive research report.`,
            temperature,
            maxOutputTokens: maxTokens,
          })

          // Stream text chunks to client
          for await (const chunk of result.textStream) {
            if (chunk) {
              fullContent += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: "content", 
                content: chunk 
              })}\n\n`))
            }
          }

          // Extract key findings from the response
          const findings = extractFindings(fullContent)
          const relatedQuestions = extractRelatedQuestions(fullContent)

          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "complete",
            fullContent,
            findings,
            relatedQuestions
          })}\n\n`))

          // Save to database (non-blocking) - only if user is logged in
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "research",
              prompt: query,
              content: fullContent,
              options: { depth },
              metadata: { 
                findingsCount: findings.length,
                relatedQuestionsCount: relatedQuestions.length
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: "error",
            error: error instanceof Error ? error.message : "Research failed" 
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
    console.error("Research API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 }
    )
  }
}

// Extract key findings from research content
function extractFindings(content: string): string[] {
  const findings: string[] = []
  
  // Look for bullet points under "Key Findings"
  const keyFindingsMatch = content.match(/## Key Findings\n([\s\S]*?)(?=##|$)/i)
  if (keyFindingsMatch) {
    const lines = keyFindingsMatch[1].split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        findings.push(trimmed.replace(/^[-•]\s*/, ''))
      }
    }
  }
  
  // If no structured findings, extract from numbered lists
  if (findings.length === 0) {
    const numberedMatches = content.match(/\d+\.\s+([^\n]+)/g)
    if (numberedMatches) {
      findings.push(...numberedMatches.slice(0, 5).map(m => m.replace(/^\d+\.\s*/, '')))
    }
  }
  
  return findings.slice(0, 10)
}

// Extract related questions from research content
function extractRelatedQuestions(content: string): string[] {
  const questions: string[] = []
  
  // Look for section with related questions
  const relatedMatch = content.match(/## Related Questions[^\n]*\n([\s\S]*?)(?=##|$)/i)
  if (relatedMatch) {
    const lines = relatedMatch[1].split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
        questions.push(trimmed.replace(/^[-•\d.]\s*/, ''))
      }
    }
  }
  
  // If no structured questions, look for question marks
  if (questions.length === 0) {
    const questionMatches = content.match(/[^.!?\n]+\?/g)
    if (questionMatches) {
      questions.push(...questionMatches.slice(0, 5).map(q => q.trim()))
    }
  }
  
  return questions.slice(0, 5)
}
