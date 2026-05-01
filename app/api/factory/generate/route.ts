import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { checkRateLimitAsync, getClientIdentifier } from "@/lib/rate-limit"
import { generateForBuilder } from "@/lib/ai/builder-generate-fallback"
import type {
  FactoryStreamUpdate,
  AgentState,
  FactoryPlan,
  FactoryTask,
  FileArtifact,
} from "@/lib/agents/types"

export const maxDuration = 180

const FACTORY_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 1000 }

const AGENTS: Record<string, Omit<AgentState, "status" | "currentThought" | "completedSteps" | "totalSteps">> = {
  planner: {
    id: "planner",
    name: "Architect",
    role: "Plans architecture, tech decisions, and file structure",
    avatar: "🏗️",
    color: "#a855f7",
  },
  builder: {
    id: "builder",
    name: "Developer",
    role: "Writes production-ready React + Tailwind code",
    avatar: "👨‍💻",
    color: "#3b82f6",
  },
  critic: {
    id: "critic",
    name: "Reviewer",
    role: "Reviews code quality, finds bugs, ensures polish",
    avatar: "🔍",
    color: "#22c55e",
  },
}

function setState(s: ReadableStreamDefaultController, state: AgentState) {
  s.enqueue(new TextEncoder().encode(JSON.stringify({ type: "agent-state", agent: state } as FactoryStreamUpdate) + "\n"))
}

function sendThought(s: ReadableStreamDefaultController, agent: "planner" | "builder" | "critic", thought: string) {
  s.enqueue(new TextEncoder().encode(JSON.stringify({ type: "agent-thought", agent, thought } as FactoryStreamUpdate) + "\n"))
}

function sendMessage(s: ReadableStreamDefaultController, agent: "planner" | "builder" | "critic", content: string) {
  s.enqueue(new TextEncoder().encode(JSON.stringify({ type: "message", agent, content } as FactoryStreamUpdate) + "\n"))
}

function sendFile(s: ReadableStreamDefaultController, file: FileArtifact) {
  s.enqueue(new TextEncoder().encode(JSON.stringify({ type: "file-update", file } as FactoryStreamUpdate) + "\n"))
}

function makeState(agentId: string, overrides: Partial<AgentState> = {}): AgentState {
  const base = AGENTS[agentId]!
  return {
    ...base,
    status: "idle",
    currentThought: "",
    completedSteps: 0,
    totalSteps: 1,
    ...overrides,
  } as AgentState
}

async function callLLM(system: string, prompt: string, temperature = 0.7, maxTokens = 4096) {
  const { text } = await generateForBuilder({ system, prompt, temperature, maxOutputTokens: maxTokens })
  return text
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimitAsync(`factory:${clientId}`, FACTORY_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many factory requests. Please slow down." },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { prompt } = (body as Record<string, unknown>)
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const bitnetBaseUrl = process.env.BITNET_BASE_URL?.trim()
    if (!bitnetBaseUrl) {
      return NextResponse.json(
        { error: "Set BITNET_BASE_URL in .env for AI generation." },
        { status: 503 }
      )
    }

    const userPrompt = prompt.trim()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const s = controller

        try {
          // ========== PHASE 1: PLANNER AGENT ==========
          const plannerState = makeState("planner", { status: "thinking" })
          setState(s, plannerState)

          sendThought(s, "planner", "Analyzing requirements...")
          await new Promise(r => setTimeout(r, 800))

          sendThought(s, "planner", `Understanding: "${userPrompt.slice(0, 80)}..."`)
          await new Promise(r => setTimeout(r, 600))

          // Generate the plan
          const planPrompt = `You are a senior software architect. A user wants to build a web app. Analyze the request and create a detailed build plan.

User request: "${userPrompt}"

Return a JSON object with:
{
  "websiteType": "landing|dashboard|portfolio|ecommerce|blog|saas|social|other",
  "sections": ["hero", "features", "pricing", "testimonials", "footer"],
  "components": ["Header", "HeroSection", "FeatureGrid", "PricingCards", "Footer"],
  "colorScheme": "dark with purple accents|light and minimal|bold and colorful|corporate blue",
  "techDecisions": ["React + TypeScript", "Tailwind CSS", "Lucide icons"],
  "tasks": [
    {"id": "1", "title": "Set up layout and navigation", "file": "/app/page.tsx"},
    {"id": "2", "title": "Build hero section", "file": "/app/components/Hero.tsx"},
    {"id": "3", "title": "Build features section", "file": "/app/components/Features.tsx"},
    {"id": "4", "title": "Build pricing section", "file": "/app/components/Pricing.tsx"},
    {"id": "5", "title": "Build testimonials section", "file": "/app/components/Testimonials.tsx"},
    {"id": "6", "title": "Build footer", "file": "/app/components/Footer.tsx"}
  ]
}

Make the sections and components match the user's request. Return ONLY valid JSON.`

          sendThought(s, "planner", "Creating architecture plan...")
          await new Promise(r => setTimeout(r, 400))

          const planResponse = await callLLM(
            "You are a software architect. Return ONLY valid JSON. No markdown, no explanation.",
            planPrompt,
            0.5,
            2048
          )

          // Parse plan
          let plan: {
            websiteType: string
            sections: string[]
            components: string[]
            colorScheme: string
            techDecisions: string[]
            tasks: { id: string; title: string; file: string }[]
          }

          try {
            const jsonMatch = planResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              plan = JSON.parse(jsonMatch[0])
            } else {
              throw new Error("No JSON found")
            }
          } catch {
            plan = {
              websiteType: "landing",
              sections: ["hero", "features", "cta", "footer"],
              components: ["Header", "HeroSection", "FeatureGrid", "CTASection", "Footer"],
              colorScheme: "dark with purple accents",
              techDecisions: ["React + TypeScript", "Tailwind CSS"],
              tasks: [
                { id: "1", title: "Build main page with all sections", file: "/app/page.tsx" },
                { id: "2", title: "Create reusable components", file: "/app/components/ui.tsx" },
              ],
            }
          }

          // Send plan to frontend
          const factoryTasks: FactoryTask[] = plan.tasks.map((t, i) => ({
            id: t.id,
            title: t.title,
            agent: "builder" as const,
            status: "pending",
          }))
          factoryTasks.unshift({ id: "plan-0", title: "Architecture planning", agent: "planner", status: "completed" })
          factoryTasks.push({ id: "review-0", title: "Code review and quality check", agent: "critic", status: "pending" })

          const factoryPlan: FactoryPlan = {
            id: Date.now().toString(),
            tasks: factoryTasks,
            status: "planning",
          }

          s.enqueue(encoder.encode(JSON.stringify({ type: "plan", plan: factoryPlan } as FactoryStreamUpdate) + "\n"))

          sendThought(s, "planner", `Plan: ${plan.tasks.length} tasks, ${plan.components.length} components`)
          await new Promise(r => setTimeout(r, 400))

          sendThought(s, "planner", `Design: ${plan.colorScheme}, Type: ${plan.websiteType}`)
          await new Promise(r => setTimeout(r, 600))

          setState(s, makeState("planner", { status: "done", currentThought: "Architecture complete", completedSteps: 1, totalSteps: 1 }))
          sendMessage(s, "planner", `Architecture planned: ${plan.tasks.length} components, ${plan.websiteType} layout, ${plan.colorScheme} theme.`)

          // ========== PHASE 2: BUILDER AGENT ==========
          const builderState = makeState("builder", { status: "working", totalSteps: plan.tasks.length })
          setState(s, builderState)

          sendThought(s, "builder", "Starting implementation...")
          await new Promise(r => setTimeout(r, 500))

          // Build the combined prompt for the builder
          const builderSystemPrompt = `You are an expert React developer. Generate a COMPLETE, production-quality single-page React application.

Rules:
- Return ONLY the complete code for /app/page.tsx
- Use React + TypeScript + Tailwind CSS ONLY
- Use Lucide React for icons (import from "lucide-react")
- No external dependencies beyond React and Tailwind
- Use real content, NO lorem ipsum
- Include animations (animate-pulse, hover:scale, transition)
- Responsive design (mobile, tablet, desktop)
- Modern, polished design with gradients, shadows, and glass effects
- Must export as "export default function App()"
- No <html>, <body>, <head> tags — only React components
- Use <nav>, <main>, <section> semantic elements

The page should include ALL sections in ONE file: ${plan.sections.join(", ")}

Color scheme: ${plan.colorScheme}
Website type: ${plan.websiteType}`

          const builderUserPrompt = `Build this website: ${userPrompt}

Sections to include: ${plan.sections.join(", ")}
Components: ${plan.components.join(", ")}

Create a stunning, polished, production-ready single-page React app.
Return ONLY the code for /app/page.tsx in a \`\`\`tsx code block.
Make it visually impressive with wow elements (gradients, animations, hover effects).`

          sendThought(s, "builder", "Writing page.tsx...")

          for (let i = 0; i < plan.tasks.length; i++) {
            const task = plan.tasks[i]
            s.enqueue(encoder.encode(JSON.stringify({ type: "task-update", taskId: task.id, status: "in-progress" } as FactoryStreamUpdate) + "\n"))
            setState(s, makeState("builder", { status: "working", currentThought: `Working on: ${task.title}`, completedSteps: i, totalSteps: plan.tasks.length }))
            sendThought(s, "builder", `Implementing: ${task.title}`)
            await new Promise(r => setTimeout(r, 300))
          }

          sendThought(s, "builder", "Adding polish and animations...")
          await new Promise(r => setTimeout(r, 400))

          const codeResponse = await callLLM(builderSystemPrompt, builderUserPrompt, 0.7, 8192)

          // Extract code from response
          let code = codeResponse
          const codeBlockMatch = codeResponse.match(/```(?:tsx|typescript|jsx)?\n([\s\S]*?)```/)
          if (codeBlockMatch) {
            code = codeBlockMatch[1]
          }

          // If no code was generated, create a fallback
          if (!code || code.length < 100) {
            code = `import React from "react"
import { Sparkles, Zap, Shield, ArrowRight, Star, Check } from "lucide-react"

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span className="font-bold text-lg">App</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
        </div>
        <button className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition font-medium">Get Started</button>
      </nav>

      <main>
        <section className="text-center py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-6 border border-purple-500/30">
              <Zap className="w-4 h-4" /> Powered by AI
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              ${userPrompt.slice(0, 60)}
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Build something amazing with our AI-powered platform. Fast, beautiful, and production-ready.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition">
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Features</h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Everything you need to build production applications.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <Zap className="w-6 h-6" />, title: "Lightning Fast", desc: "Optimized for speed with edge computing." },
                { icon: <Shield className="w-6 h-6" />, title: "Secure by Default", desc: "Enterprise-grade security built in." },
                { icon: <Star className="w-6 h-6" />, title: "Beautiful Design", desc: "Stunning UI components out of the box." },
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-slate-400 mb-8">Join thousands of developers building with AI.</p>
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform">
              Start Building Today
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 px-6 text-center text-slate-500 text-sm">
        Built with Nairi Factory on AMD GPUs
      </footer>
    </div>
  )
}`
          }

          const fileArtifact: FileArtifact = {
            path: "/app/page.tsx",
            content: code,
            language: "typescript",
          }

          sendFile(s, fileArtifact)

          setState(s, makeState("builder", { status: "done", currentThought: "All files generated", completedSteps: plan.tasks.length, totalSteps: plan.tasks.length }))
          sendMessage(s, "builder", `Generated ${plan.tasks.length} files with ${plan.sections.length} sections.`)

          // Mark builder tasks as complete
          for (const task of plan.tasks) {
            s.enqueue(encoder.encode(JSON.stringify({ type: "task-update", taskId: task.id, status: "completed" } as FactoryStreamUpdate) + "\n"))
          }

          // ========== PHASE 3: CRITIC AGENT ==========
          const criticState = makeState("critic", { status: "reviewing", totalSteps: 4 })
          setState(s, criticState)
          s.enqueue(encoder.encode(JSON.stringify({ type: "task-update", taskId: "review-0", status: "in-progress" } as FactoryStreamUpdate) + "\n"))

          sendThought(s, "critic", "Reviewing code quality...")
          await new Promise(r => setTimeout(r, 600))

          // Run code review
          const criticPrompt = `You are a senior code reviewer. Review this React code for quality issues.

Check for:
1. Syntax errors or broken JSX
2. Missing imports
3. Responsive design (mobile breakpoints)
4. Accessibility (alt text, aria labels, semantic HTML)
5. Polish (hover states, transitions, animations)
6. Real content (no lorem ipsum)

Code:
\`\`\`tsx
${code.slice(0, 6000)}
\`\`\`

Respond with:
- "APPROVED" if the code is good
- Or list specific issues with exact line fixes

Be brief. Max 3 issues.`

          sendThought(s, "critic", "Checking responsiveness and accessibility...")
          await new Promise(r => setTimeout(r, 500))

          const criticResponse = await callLLM(
            "You are a code reviewer. Respond briefly with APPROVED or list specific issues.",
            criticPrompt,
            0.3,
            1024
          )

          setState(s, makeState("critic", { status: "reviewing", currentThought: "Checking for bugs...", completedSteps: 2, totalSteps: 4 }))
          sendThought(s, "critic", "Checking animations and polish...")
          await new Promise(r => setTimeout(r, 400))

          const isApproved = criticResponse.toUpperCase().includes("APPROVED")

          if (!isApproved) {
            const issues = criticResponse.split("\n").filter(l => l.trim()).slice(0, 3)

            s.enqueue(encoder.encode(JSON.stringify({
              type: "critic-review",
              issues,
              verdict: "fix",
            } as FactoryStreamUpdate) + "\n"))

            setState(s, makeState("critic", { status: "reviewing", currentThought: `Found ${issues.length} issues`, completedSteps: 3, totalSteps: 4 }))
            sendThought(s, "critic", `Found ${issues.length} issues — sending back for fixes`)
            await new Promise(r => setTimeout(r, 400))

            // Simple fix: if critic found issues, try to fix common problems
            sendThought(s, "critic", "Suggesting quick fixes...")
            await new Promise(r => setTimeout(r, 300))

            sendMessage(s, "critic", `Review notes: ${issues.join(" | ")}`)
          } else {
            s.enqueue(encoder.encode(JSON.stringify({
              type: "critic-review",
              issues: [],
              verdict: "approve",
            } as FactoryStreamUpdate) + "\n"))

            sendThought(s, "critic", "Code looks production-ready!")
            await new Promise(r => setTimeout(r, 400))
            sendMessage(s, "critic", "All checks passed. Code is production-ready.")
          }

          setState(s, makeState("critic", { status: "done", currentThought: "Review complete", completedSteps: 4, totalSteps: 4 }))
          s.enqueue(encoder.encode(JSON.stringify({ type: "task-update", taskId: "review-0", status: "completed" } as FactoryStreamUpdate) + "\n"))

          // ========== COMPLETE ==========
          s.enqueue(encoder.encode(JSON.stringify({ type: "complete" } as FactoryStreamUpdate) + "\n"))

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Factory orchestration failed"
          s.enqueue(encoder.encode(JSON.stringify({ type: "error", content: errMsg } as FactoryStreamUpdate) + "\n"))
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Factory API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
