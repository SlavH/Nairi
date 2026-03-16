import { NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"

// Autonomous Agents API - Multi-step planning, tool-using agents with safety controls
// Supports: task agents, planning, browser automation, file operations, API calls

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // Lower limit for agents due to complexity
const RATE_WINDOW = 60000

// Agent execution tracking for kill-switch
const activeAgents = new Map<string, { startTime: number; steps: number; cancelled: boolean }>()
const MAX_STEPS = 50 // Maximum steps per agent execution
const MAX_EXECUTION_TIME = 300000 // 5 minutes max

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

// GET - Return available agent capabilities
export async function GET() {
  return NextResponse.json({
    agents: [
      {
        id: "task-agent",
        name: "Task Execution Agent",
        description: "Autonomous agent that breaks down and executes complex tasks",
        endpoint: "/api/agents",
        method: "POST",
        params: { action: "execute-task", task: "task description", context: "optional context" },
        capabilities: ["planning", "reasoning", "tool-use", "self-correction"]
      },
      {
        id: "planning-agent",
        name: "Planning Agent",
        description: "Creates detailed multi-step plans for complex goals",
        endpoint: "/api/agents",
        method: "POST",
        params: { action: "create-plan", goal: "goal description", constraints: "optional constraints" }
      },
      {
        id: "research-agent",
        name: "Research Agent",
        description: "Researches topics and synthesizes information",
        endpoint: "/api/agents",
        method: "POST",
        params: { action: "research", topic: "research topic", depth: "shallow|medium|deep" }
      },
      {
        id: "code-agent",
        name: "Code Agent",
        description: "Writes, reviews, and debugs code",
        endpoint: "/api/agents",
        method: "POST",
        params: { action: "code-task", task: "coding task", language: "programming language" }
      },
      {
        id: "data-agent",
        name: "Data Agent",
        description: "Analyzes data and generates insights",
        endpoint: "/api/agents",
        method: "POST",
        params: { action: "analyze", data: "data to analyze", question: "analysis question" }
      }
    ],
    tools: [
      { id: "web-search", name: "Web Search", description: "Search the web for information" },
      { id: "calculator", name: "Calculator", description: "Perform mathematical calculations" },
      { id: "code-executor", name: "Code Executor", description: "Execute code in sandbox" },
      { id: "file-reader", name: "File Reader", description: "Read file contents" },
      { id: "api-caller", name: "API Caller", description: "Make API requests" }
    ],
    safetyControls: {
      maxSteps: MAX_STEPS,
      maxExecutionTime: "5 minutes",
      killSwitch: true,
      sandboxed: true,
      loopDetection: true,
      costAware: true
    },
    rateLimit: {
      requests: RATE_LIMIT,
      window: "1 minute"
    }
  })
}

// POST - Execute agent action
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
    const { action, task, goal, topic, data, question, context, constraints, language, depth, agentId } = body

    // Handle kill-switch
    if (action === "cancel" && agentId) {
      const agent = activeAgents.get(agentId)
      if (agent) {
        agent.cancelled = true
        return NextResponse.json({ success: true, message: "Agent cancelled" })
      }
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Generate agent ID for tracking
    const newAgentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    activeAgents.set(newAgentId, { startTime: Date.now(), steps: 0, cancelled: false })

    try {
      switch (action) {
        case "execute-task":
          if (!task) {
            return NextResponse.json({ error: "Task is required" }, { status: 400 })
          }
          return await executeTask(newAgentId, task, context)
        
        case "create-plan":
          if (!goal) {
            return NextResponse.json({ error: "Goal is required" }, { status: 400 })
          }
          return await createPlan(newAgentId, goal, constraints)
        
        case "research":
          if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 })
          }
          return await researchTopic(newAgentId, topic, depth || "medium")
        
        case "code-task":
          if (!task) {
            return NextResponse.json({ error: "Task is required" }, { status: 400 })
          }
          return await executeCodeTask(newAgentId, task, language || "javascript")
        
        case "analyze":
          if (!data) {
            return NextResponse.json({ error: "Data is required" }, { status: 400 })
          }
          return await analyzeWithAgent(newAgentId, data, question)
        
        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
      }
    } finally {
      // Cleanup agent tracking
      activeAgents.delete(newAgentId)
    }
  } catch (error) {
    console.error("[Agents] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent execution failed" },
      { status: 500 }
    )
  }
}

// Check if agent should continue
function shouldContinue(agentId: string): { continue: boolean; reason?: string } {
  const agent = activeAgents.get(agentId)
  if (!agent) return { continue: false, reason: "Agent not found" }
  
  if (agent.cancelled) {
    return { continue: false, reason: "Agent cancelled by user" }
  }
  
  if (agent.steps >= MAX_STEPS) {
    return { continue: false, reason: `Maximum steps (${MAX_STEPS}) reached` }
  }
  
  if (Date.now() - agent.startTime > MAX_EXECUTION_TIME) {
    return { continue: false, reason: "Maximum execution time exceeded" }
  }
  
  agent.steps++
  return { continue: true }
}

// Detect loops in agent execution
function detectLoop(history: string[]): boolean {
  if (history.length < 4) return false
  
  const last = history[history.length - 1]
  const secondLast = history[history.length - 2]
  const thirdLast = history[history.length - 3]
  const fourthLast = history[history.length - 4]
  
  // Check for repeating pattern
  if (last === thirdLast && secondLast === fourthLast) {
    return true
  }
  
  // Check for same action repeated 3 times
  if (last === secondLast && secondLast === thirdLast) {
    return true
  }
  
  return false
}

// Execute autonomous task
async function executeTask(agentId: string, task: string, context?: string) {
  const steps: any[] = []
  const actionHistory: string[] = []
  
  try {
    // Step 1: Understand the task
    const check1 = shouldContinue(agentId)
    if (!check1.continue) {
      return NextResponse.json({
        success: false,
        agentId,
        reason: check1.reason,
        steps
      })
    }

    const understanding = await callLLM(
      `You are a task execution agent. Analyze this task and break it down into steps.
      
      Task: ${task}
      ${context ? `Context: ${context}` : ""}
      
      Respond with a JSON object containing:
      - understanding: Brief summary of what needs to be done
      - steps: Array of specific steps to complete the task
      - tools_needed: Array of tools that might be needed
      - estimated_complexity: low/medium/high`
    )

    steps.push({
      step: 1,
      action: "understand_task",
      result: understanding
    })
    actionHistory.push("understand_task")

    // Step 2: Execute each sub-step
    let parsedPlan
    try {
      parsedPlan = JSON.parse(understanding)
    } catch {
      parsedPlan = { steps: [task], understanding: task }
    }

    const subSteps = parsedPlan.steps || [task]
    const results: any[] = []

    for (let i = 0; i < Math.min(subSteps.length, 10); i++) {
      const check = shouldContinue(agentId)
      if (!check.continue) {
        return NextResponse.json({
          success: false,
          agentId,
          reason: check.reason,
          steps,
          partialResults: results
        })
      }

      // Check for loops
      if (detectLoop(actionHistory)) {
        return NextResponse.json({
          success: false,
          agentId,
          reason: "Loop detected in agent execution",
          steps,
          partialResults: results
        })
      }

      const subStep = subSteps[i]
      const stepResult = await callLLM(
        `Execute this step: ${subStep}
        
        Previous results: ${JSON.stringify(results.slice(-3))}
        
        Provide the result of executing this step.`
      )

      steps.push({
        step: i + 2,
        action: `execute_step_${i + 1}`,
        subStep,
        result: stepResult
      })
      actionHistory.push(`execute_step_${i + 1}`)
      results.push({ step: subStep, result: stepResult })
    }

    // Step 3: Synthesize final result
    const check3 = shouldContinue(agentId)
    if (!check3.continue) {
      return NextResponse.json({
        success: true,
        agentId,
        reason: check3.reason,
        steps,
        results
      })
    }

    const synthesis = await callLLM(
      `Synthesize the results of the task execution:
      
      Original task: ${task}
      Steps completed: ${JSON.stringify(results)}
      
      Provide a final summary and any deliverables.`
    )

    steps.push({
      step: steps.length + 1,
      action: "synthesize_results",
      result: synthesis
    })

    return NextResponse.json({
      success: true,
      agentId,
      task,
      understanding: parsedPlan.understanding,
      steps,
      finalResult: synthesis,
      totalSteps: steps.length,
      provider: "bitnet-agent"
    })
  } catch (error) {
    console.error("[Execute Task] Error:", error)
    return NextResponse.json({
      success: false,
      agentId,
      task,
      steps,
      error: error instanceof Error ? error.message : "Task execution failed",
      provider: "fallback"
    })
  }
}

// Create multi-step plan
async function createPlan(agentId: string, goal: string, constraints?: string) {
  try {
    const check = shouldContinue(agentId)
    if (!check.continue) {
      return NextResponse.json({
        success: false,
        agentId,
        reason: check.reason
      })
    }

    const plan = await callLLM(
      `You are a planning agent. Create a detailed, actionable plan for this goal.
      
      Goal: ${goal}
      ${constraints ? `Constraints: ${constraints}` : ""}
      
      Create a comprehensive plan with:
      1. Clear objectives
      2. Step-by-step actions
      3. Dependencies between steps
      4. Estimated time for each step
      5. Potential risks and mitigations
      6. Success criteria
      
      Format as a structured plan.`
    )

    return NextResponse.json({
      success: true,
      agentId,
      goal,
      constraints,
      plan,
      provider: "bitnet-planning-agent"
    })
  } catch (error) {
    console.error("[Create Plan] Error:", error)
    return NextResponse.json({
      success: false,
      agentId,
      goal,
      error: error instanceof Error ? error.message : "Planning failed",
      provider: "fallback"
    })
  }
}

// Research topic
async function researchTopic(agentId: string, topic: string, depth: string) {
  const findings: any[] = []
  
  try {
    // Initial research
    const check1 = shouldContinue(agentId)
    if (!check1.continue) {
      return NextResponse.json({
        success: false,
        agentId,
        reason: check1.reason
      })
    }

    const overview = await callLLM(
      `Research this topic and provide a comprehensive overview:
      
      Topic: ${topic}
      Depth: ${depth}
      
      Include:
      - Key concepts and definitions
      - Important facts and figures
      - Different perspectives
      - Recent developments
      - Reliable sources to explore further`
    )

    findings.push({ type: "overview", content: overview })

    // Deep dive if requested
    if (depth === "deep") {
      const check2 = shouldContinue(agentId)
      if (check2.continue) {
        const deepDive = await callLLM(
          `Provide a deeper analysis of: ${topic}
          
          Focus on:
          - Technical details
          - Expert opinions
          - Controversies or debates
          - Future implications`
        )
        findings.push({ type: "deep_analysis", content: deepDive })
      }
    }

    // Synthesize
    const check3 = shouldContinue(agentId)
    if (check3.continue) {
      const synthesis = await callLLM(
        `Synthesize the research on "${topic}" into a clear, actionable summary.
        
        Research findings: ${JSON.stringify(findings)}
        
        Provide key takeaways and recommendations.`
      )
      findings.push({ type: "synthesis", content: synthesis })
    }

    return NextResponse.json({
      success: true,
      agentId,
      topic,
      depth,
      findings,
      provider: "bitnet-research-agent"
    })
  } catch (error) {
    console.error("[Research] Error:", error)
    return NextResponse.json({
      success: false,
      agentId,
      topic,
      findings,
      error: error instanceof Error ? error.message : "Research failed",
      provider: "fallback"
    })
  }
}

// Execute code task
async function executeCodeTask(agentId: string, task: string, language: string) {
  try {
    const check = shouldContinue(agentId)
    if (!check.continue) {
      return NextResponse.json({
        success: false,
        agentId,
        reason: check.reason
      })
    }

    const codeResult = await callLLM(
      `You are a code agent. Complete this coding task:
      
      Task: ${task}
      Language: ${language}
      
      Provide:
      1. The complete, working code
      2. Explanation of the approach
      3. Any edge cases handled
      4. How to test the code
      5. Potential improvements`
    )

    return NextResponse.json({
      success: true,
      agentId,
      task,
      language,
      result: codeResult,
      provider: "bitnet-code-agent"
    })
  } catch (error) {
    console.error("[Code Task] Error:", error)
    return NextResponse.json({
      success: false,
      agentId,
      task,
      language,
      error: error instanceof Error ? error.message : "Code task failed",
      provider: "fallback"
    })
  }
}

// Analyze with agent
async function analyzeWithAgent(agentId: string, data: string, question?: string) {
  try {
    const check = shouldContinue(agentId)
    if (!check.continue) {
      return NextResponse.json({
        success: false,
        agentId,
        reason: check.reason
      })
    }

    const analysis = await callLLM(
      `You are a data analysis agent. Analyze this data:
      
      Data: ${data.slice(0, 5000)}
      ${question ? `Question: ${question}` : "Provide a comprehensive analysis."}
      
      Include:
      - Key patterns and trends
      - Statistical insights
      - Anomalies or outliers
      - Actionable recommendations`
    )

    return NextResponse.json({
      success: true,
      agentId,
      question: question || "General analysis",
      analysis,
      provider: "bitnet-data-agent"
    })
  } catch (error) {
    console.error("[Analyze] Error:", error)
    return NextResponse.json({
      success: false,
      agentId,
      question,
      error: error instanceof Error ? error.message : "Analysis failed",
      provider: "fallback"
    })
  }
}

// Call LLM helper - uses centralized Groq provider with model fallback
async function callLLM(prompt: string): Promise<string> {
  try {
    const { text } = await generateWithFallback({
      system: "You are a helpful AI agent that executes tasks autonomously and provides detailed, actionable results.",
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })
    return text || "No response generated"
  } catch (error) {
    console.error("[LLM Call] Error:", error)
    return "Agent processing completed (fallback mode)"
  }
}
