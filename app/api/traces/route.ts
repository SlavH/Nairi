import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch user's execution traces
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const operationType = url.searchParams.get("type")
    const status = url.searchParams.get("status")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    let query = supabase
      .from("execution_traces")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (operationType) {
      query = query.eq("operation_type", operationType)
    }
    
    if (status) {
      query = query.eq("status", status)
    }

    const { data: traces, error, count } = await query

    if (error) {
      console.error("Traces fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from("execution_traces")
      .select("operation_type, status, tokens_input, tokens_output, credits_consumed, duration_ms")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const summary = stats?.reduce((acc, trace) => {
      acc.totalOperations++
      acc.totalTokensInput += trace.tokens_input || 0
      acc.totalTokensOutput += trace.tokens_output || 0
      acc.totalCredits += trace.credits_consumed || 0
      acc.totalDuration += trace.duration_ms || 0
      
      acc.byType[trace.operation_type] = (acc.byType[trace.operation_type] || 0) + 1
      acc.byStatus[trace.status] = (acc.byStatus[trace.status] || 0) + 1
      
      return acc
    }, {
      totalOperations: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      totalCredits: 0,
      totalDuration: 0,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    }) || {
      totalOperations: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      totalCredits: 0,
      totalDuration: 0,
      byType: {},
      byStatus: {}
    }

    return NextResponse.json({
      traces: traces || [],
      total: count || 0,
      summary
    })

  } catch (error) {
    console.error("Traces API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Start a new execution trace
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { operationType, conversationId, inputSummary, provider, model } = await req.json()

    if (!operationType) {
      return NextResponse.json({ error: "operationType is required" }, { status: 400 })
    }

    const validTypes = ["chat", "creation", "analysis", "code_generation", "search", "tool_call"]
    if (!validTypes.includes(operationType)) {
      return NextResponse.json({ error: "Invalid operation type" }, { status: 400 })
    }

    const { data: trace, error } = await supabase
      .from("execution_traces")
      .insert({
        user_id: user.id,
        operation_type: operationType,
        conversation_id: conversationId,
        input_summary: inputSummary,
        provider,
        model,
        status: "running",
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Trace insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trace })

  } catch (error) {
    console.error("Traces POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Complete an execution trace
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      traceId, 
      status, 
      outputSummary, 
      tokensInput, 
      tokensOutput, 
      creditsConsumed, 
      errorMessage,
      traceData 
    } = await req.json()

    if (!traceId || !status) {
      return NextResponse.json({ error: "traceId and status are required" }, { status: 400 })
    }

    // Get original trace to calculate duration
    const { data: originalTrace } = await supabase
      .from("execution_traces")
      .select("started_at")
      .eq("id", traceId)
      .eq("user_id", user.id)
      .single()

    if (!originalTrace) {
      return NextResponse.json({ error: "Trace not found" }, { status: 404 })
    }

    const startedAt = new Date(originalTrace.started_at)
    const durationMs = Date.now() - startedAt.getTime()

    const { data: trace, error } = await supabase
      .from("execution_traces")
      .update({
        status,
        output_summary: outputSummary,
        tokens_input: tokensInput || 0,
        tokens_output: tokensOutput || 0,
        credits_consumed: creditsConsumed || 0,
        error_message: errorMessage,
        trace_data: traceData || {},
        duration_ms: durationMs,
        completed_at: new Date().toISOString()
      })
      .eq("id", traceId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Trace update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trace })

  } catch (error) {
    console.error("Traces PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
