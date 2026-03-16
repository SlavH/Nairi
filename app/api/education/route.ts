import { NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"

// Education AI API - AI Tutor, Quiz Generation, Step-by-step explanations
// With academic integrity safeguards

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// GET - Return available education tools
export async function GET() {
  return NextResponse.json({
    tools: [
      {
        id: "ai-tutor",
        name: "AI Tutor",
        description: "Interactive AI tutor for any subject",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "tutor", subject: "subject", question: "student question", level: "beginner|intermediate|advanced" }
      },
      {
        id: "explain",
        name: "Step-by-Step Explanation",
        description: "Get detailed explanations with steps",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "explain", topic: "topic to explain", depth: "brief|detailed|comprehensive" }
      },
      {
        id: "quiz",
        name: "Quiz Generator",
        description: "Generate quizzes on any topic",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "generate-quiz", topic: "quiz topic", count: "number of questions", difficulty: "easy|medium|hard" }
      },
      {
        id: "homework-help",
        name: "Homework Helper",
        description: "Get guidance on homework (not direct answers)",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "homework-help", problem: "homework problem", subject: "subject" },
        note: "Provides guidance and hints, not direct answers to maintain academic integrity"
      },
      {
        id: "practice",
        name: "Practice Problems",
        description: "Generate practice problems with solutions",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "practice", topic: "topic", count: "number of problems", difficulty: "easy|medium|hard" }
      },
      {
        id: "flashcards",
        name: "Flashcard Generator",
        description: "Create study flashcards",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "flashcards", topic: "topic", count: "number of cards" }
      },
      {
        id: "study-plan",
        name: "Study Plan Creator",
        description: "Create personalized study plans",
        endpoint: "/api/education",
        method: "POST",
        params: { action: "study-plan", subject: "subject", goal: "learning goal", timeframe: "days/weeks" }
      }
    ],
    subjects: [
      "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
      "History", "Geography", "Literature", "Languages", "Economics",
      "Psychology", "Philosophy", "Art", "Music", "Engineering"
    ],
    academicIntegrity: {
      policy: "This tool provides educational guidance and helps students learn. It does not provide direct answers to homework or exam questions.",
      features: [
        "Hints and guidance instead of direct answers",
        "Explanation of concepts and methods",
        "Practice problems with worked solutions",
        "Study resources and learning paths"
      ]
    },
    rateLimit: {
      requests: RATE_LIMIT,
      window: "1 minute"
    }
  })
}

// POST - Process education request
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making more requests." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { action, subject, question, topic, level, depth, count, difficulty, problem, goal, timeframe } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    switch (action) {
      case "tutor":
        if (!question) {
          return NextResponse.json({ error: "Question is required" }, { status: 400 })
        }
        return await aiTutor(subject || "General", question, level || "intermediate")
      
      case "explain":
        if (!topic) {
          return NextResponse.json({ error: "Topic is required" }, { status: 400 })
        }
        return await explainTopic(topic, depth || "detailed")
      
      case "generate-quiz":
        if (!topic) {
          return NextResponse.json({ error: "Topic is required" }, { status: 400 })
        }
        return await generateQuiz(topic, count || 5, difficulty || "medium")
      
      case "homework-help":
        if (!problem) {
          return NextResponse.json({ error: "Problem is required" }, { status: 400 })
        }
        return await homeworkHelp(problem, subject || "General")
      
      case "practice":
        if (!topic) {
          return NextResponse.json({ error: "Topic is required" }, { status: 400 })
        }
        return await generatePractice(topic, count || 5, difficulty || "medium")
      
      case "flashcards":
        if (!topic) {
          return NextResponse.json({ error: "Topic is required" }, { status: 400 })
        }
        return await generateFlashcards(topic, count || 10)
      
      case "study-plan":
        if (!subject || !goal) {
          return NextResponse.json({ error: "Subject and goal are required" }, { status: 400 })
        }
        return await createStudyPlan(subject, goal, timeframe || "2 weeks")
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("[Education] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    )
  }
}

// AI Tutor
async function aiTutor(subject: string, question: string, level: string) {
  try {
    const response = await callLLM(
      `You are an expert ${subject} tutor. A ${level}-level student asks:

"${question}"

Provide a helpful, educational response that:
1. Addresses the question directly
2. Explains underlying concepts
3. Uses examples appropriate for the student's level
4. Encourages further learning
5. Suggests related topics to explore

Be encouraging and supportive while maintaining educational rigor.`
    )

    return NextResponse.json({
      success: true,
      subject,
      question,
      level,
      response,
      followUpSuggestions: [
        "Would you like me to explain any part in more detail?",
        "Should I provide practice problems on this topic?",
        "Do you want to explore related concepts?"
      ],
      provider: "bitnet-tutor"
    })
  } catch (error) {
    console.error("[AI Tutor] Error:", error)
    return NextResponse.json({
      success: false,
      subject,
      question,
      error: "Tutor service unavailable",
      provider: "fallback"
    })
  }
}

// Step-by-step explanation
async function explainTopic(topic: string, depth: string) {
  try {
    const depthInstructions = {
      brief: "Provide a concise explanation in 2-3 paragraphs.",
      detailed: "Provide a thorough explanation with examples and key points.",
      comprehensive: "Provide an in-depth explanation covering all aspects, with multiple examples, historical context, and practical applications."
    }

    const response = await callLLM(
      `Explain the following topic step by step:

Topic: ${topic}

${depthInstructions[depth as keyof typeof depthInstructions] || depthInstructions.detailed}

Structure your explanation with:
1. Introduction/Overview
2. Key Concepts (numbered steps)
3. Examples
4. Common Misconceptions
5. Summary
6. Further Reading Suggestions`
    )

    return NextResponse.json({
      success: true,
      topic,
      depth,
      explanation: response,
      provider: "bitnet-explainer"
    })
  } catch (error) {
    console.error("[Explain] Error:", error)
    return NextResponse.json({
      success: false,
      topic,
      error: "Explanation service unavailable",
      provider: "fallback"
    })
  }
}

// Quiz Generator
async function generateQuiz(topic: string, count: number, difficulty: string) {
  try {
    const response = await callLLM(
      `Generate a ${difficulty} difficulty quiz on "${topic}" with exactly ${Math.min(count, 20)} questions.

Format each question as JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}

Make questions educational and appropriate for the ${difficulty} level.
Include a mix of question types: factual, conceptual, and application-based.`
    )

    let quiz
    try {
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0])
      } else {
        quiz = { questions: [], rawResponse: response }
      }
    } catch {
      quiz = { questions: [], rawResponse: response }
    }

    return NextResponse.json({
      success: true,
      topic,
      difficulty,
      requestedCount: count,
      quiz,
      provider: "bitnet-quiz-generator"
    })
  } catch (error) {
    console.error("[Quiz] Error:", error)
    return NextResponse.json({
      success: false,
      topic,
      error: "Quiz generation unavailable",
      provider: "fallback"
    })
  }
}

// Homework Help (with academic integrity)
async function homeworkHelp(problem: string, subject: string) {
  try {
    const response = await callLLM(
      `A student needs help with this ${subject} homework problem:

"${problem}"

IMPORTANT: Do NOT provide the direct answer. Instead:

1. Identify the type of problem
2. Explain the relevant concepts needed to solve it
3. Provide a step-by-step approach (without solving)
4. Give hints that guide toward the solution
5. Suggest similar practice problems
6. Point to resources for learning more

The goal is to help the student LEARN, not to do their homework for them.
This maintains academic integrity while providing genuine educational support.`
    )

    return NextResponse.json({
      success: true,
      subject,
      problem,
      guidance: response,
      academicIntegrityNote: "This response provides guidance and hints to help you learn. The actual solution is for you to work out, which is how real learning happens!",
      provider: "bitnet-homework-helper"
    })
  } catch (error) {
    console.error("[Homework Help] Error:", error)
    return NextResponse.json({
      success: false,
      subject,
      problem,
      error: "Homework help unavailable",
      provider: "fallback"
    })
  }
}

// Practice Problem Generator
async function generatePractice(topic: string, count: number, difficulty: string) {
  try {
    const response = await callLLM(
      `Generate ${Math.min(count, 10)} ${difficulty} practice problems on "${topic}".

For each problem, provide:
1. The problem statement
2. Hints (without giving away the answer)
3. The complete solution with explanation
4. Key concepts being tested

Format as a structured list. Make problems progressively challenging.`
    )

    return NextResponse.json({
      success: true,
      topic,
      difficulty,
      count: Math.min(count, 10),
      problems: response,
      provider: "bitnet-practice-generator"
    })
  } catch (error) {
    console.error("[Practice] Error:", error)
    return NextResponse.json({
      success: false,
      topic,
      error: "Practice generation unavailable",
      provider: "fallback"
    })
  }
}

// Flashcard Generator
async function generateFlashcards(topic: string, count: number) {
  try {
    const response = await callLLM(
      `Create ${Math.min(count, 30)} study flashcards for "${topic}".

Format as JSON:
{
  "flashcards": [
    {
      "id": 1,
      "front": "Question or term",
      "back": "Answer or definition",
      "category": "subcategory if applicable"
    }
  ]
}

Include a mix of:
- Key terms and definitions
- Important concepts
- Facts and figures
- Application questions`
    )

    let flashcards
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0])
      } else {
        flashcards = { flashcards: [], rawResponse: response }
      }
    } catch {
      flashcards = { flashcards: [], rawResponse: response }
    }

    return NextResponse.json({
      success: true,
      topic,
      requestedCount: count,
      flashcards,
      provider: "bitnet-flashcard-generator"
    })
  } catch (error) {
    console.error("[Flashcards] Error:", error)
    return NextResponse.json({
      success: false,
      topic,
      error: "Flashcard generation unavailable",
      provider: "fallback"
    })
  }
}

// Study Plan Creator
async function createStudyPlan(subject: string, goal: string, timeframe: string) {
  try {
    const response = await callLLM(
      `Create a personalized study plan:

Subject: ${subject}
Goal: ${goal}
Timeframe: ${timeframe}

Provide a detailed study plan including:
1. Learning objectives broken down by week/day
2. Specific topics to cover each session
3. Recommended resources (books, videos, websites)
4. Practice activities and exercises
5. Milestones and checkpoints
6. Tips for staying motivated
7. How to assess progress

Make the plan realistic and achievable.`
    )

    return NextResponse.json({
      success: true,
      subject,
      goal,
      timeframe,
      studyPlan: response,
      provider: "bitnet-study-planner"
    })
  } catch (error) {
    console.error("[Study Plan] Error:", error)
    return NextResponse.json({
      success: false,
      subject,
      goal,
      error: "Study plan creation unavailable",
      provider: "fallback"
    })
  }
}

// LLM Helper - uses centralized Groq provider with model fallback
async function callLLM(prompt: string): Promise<string> {
  const { text } = await generateWithFallback({
    system: "You are an expert educator and tutor. Provide clear, accurate, and helpful educational content. Always encourage learning and critical thinking.",
    prompt,
    temperature: 0.7,
    maxOutputTokens: 3000,
  })
  return text || "No response generated"
}
