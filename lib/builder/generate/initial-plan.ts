/**
 * Builder generate: prompt analysis and initial task plan.
 * Used by the generate route to get dynamic task names from the user prompt.
 */

import { generateWithFallback } from "@/lib/ai/groq-direct"

export interface PromptAnalysis {
  intent: "clone" | "create" | "modify" | "fix" | "enhance"
  websiteType: string
  features: string[]
  colorScheme: string | null
  complexity: "simple" | "medium" | "complex" | "enterprise"
  referenceUrl: string | null
  clarifyingQuestions: string[]
}

export interface TaskPlanItem {
  id: string
  title: string
  status: string
}

/**
 * Analyze the user prompt for intent, website type, features, etc.
 */
export async function analyzePromptForPlan(prompt: string, _groqKey: string): Promise<PromptAnalysis> {
  try {
    const { text } = await generateWithFallback({
      system: "You analyze website builder requests. Respond with ONLY a JSON object.",
      prompt: `Analyze this website builder request and extract structured information.\n\nUser Request: "${prompt}"\n\nRespond with ONLY a JSON object (no markdown):\n{"intent":"clone"|"create"|"modify"|"fix"|"enhance","websiteType":"e-commerce"|"portfolio"|"dashboard"|"landing"|"viral"|"viral-landing"|"social"|"blog"|"saas"|"docs"|"marketing"|"education"|"real-estate"|"restaurant"|"event"|"help-center"|"other","features":[],"colorScheme":"dark"|"light"|"colorful"|"minimal"|null,"complexity":"simple"|"medium"|"complex"|"enterprise","referenceUrl":null,"clarifyingQuestions":[]}\n\nUse websiteType "viral" or "viral-landing" when the user asks for viral, ad-style, mind-blown, scroll-stopping, or "like in ads" style.`,
      temperature: 0.1,
      maxOutputTokens: 500,
      fast: true,
    })
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {
    // fall through
  }
  const lower = prompt.toLowerCase()
  const isViral = /viral|ad-style|mind-blown|scroll-stopping|like in ads|viral ad|stop the scroll/i.test(lower)
  return {
    intent: lower.includes("clone") ? "clone" : "create",
    websiteType: isViral ? "viral" : "other",
    features: [],
    colorScheme: null,
    complexity: "medium",
    referenceUrl: null,
    clarifyingQuestions: [],
  }
}

/**
 * Get initial task plan (dynamic task names) for the builder stream.
 * Calls LLM to generate 4-6 task names, with fallback to default tasks.
 */
export async function getInitialTaskPlan(
  prompt: string,
  groqKey: string
): Promise<TaskPlanItem[]> {
  const taskPlanPrompt = `Analyze this user request and generate 4-6 specific task names that describe what needs to be done.

User request: "${prompt}"

Respond with ONLY a JSON array of task names, like:
["Creating navigation header", "Building hero section with CTA", "Adding feature cards grid", "Implementing contact form", "Adding responsive styles"]

Make tasks specific to what the user is asking for. Do NOT use generic names like "Analyzing requirements".`

  try {
    const { text } = await generateWithFallback({
      system: "You output only valid JSON arrays. No markdown, no explanation.",
      prompt: taskPlanPrompt,
      temperature: 0.2,
      maxOutputTokens: 400,
      fast: true,
    })
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const arr = JSON.parse(jsonMatch[0]) as string[]
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.slice(0, 8).map((title, i) => ({
          id: String(i),
          title: typeof title === "string" ? title : String(title),
          status: "pending",
        }))
      }
    }
  } catch {
    // fall through to default
  }

  return [
    { id: "0", title: "Analyzing your request...", status: "pending" },
    { id: "1", title: "Planning structure", status: "pending" },
    { id: "2", title: "Generating code", status: "pending" },
    { id: "3", title: "Validating output", status: "pending" },
  ]
}
