"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentState, AgentMessage } from "@/lib/agents/types"

interface AgentFeedProps {
  agents: Record<string, AgentState>
  messages: AgentMessage[]
  isRunning: boolean
}

export function AgentFeed({ agents, messages, isRunning }: AgentFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const agentOrder = ["planner", "builder", "critic"] as const

  return (
    <div className="flex flex-col h-full">
      {/* Agent Status Cards */}
      <div className="grid grid-cols-3 gap-3 p-4 shrink-0">
        {agentOrder.map((agentId) => {
          const agent = agents[agentId]
          if (!agent) return null

          return (
            <div
              key={agentId}
              className={cn(
                "rounded-xl border p-3 transition-all duration-500",
                agent.status === "thinking" || agent.status === "working" || agent.status === "reviewing"
                  ? "border-opacity-50 bg-opacity-10 animate-pulse"
                  : agent.status === "done"
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 bg-white/5"
              )}
              style={{
                borderColor: agent.status !== "idle" ? `${agent.color}40` : undefined,
                backgroundColor: agent.status !== "idle" ? `${agent.color}08` : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{agent.avatar}</span>
                <span className="font-semibold text-sm">{agent.name}</span>
                <StatusBadge status={agent.status} color={agent.color} />
              </div>
              {agent.currentThought && (
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.currentThought}</p>
              )}
              {agent.totalSteps > 1 && (
                <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(agent.completedSteps / agent.totalSteps) * 100}%`,
                      backgroundColor: agent.color,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Message Feed */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
        <div
          ref={scrollRef}
          className="space-y-2 overflow-y-auto h-full pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {isRunning ? "Agents are working..." : "Enter a prompt to start the factory"}
            </div>
          )}
          {messages.map((msg) => {
            const agent = agents[msg.agent]
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 items-start rounded-lg px-3 py-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.type === "thought" && "bg-white/5 text-muted-foreground italic",
                  msg.type === "action" && "bg-white/10 text-foreground",
                  msg.type === "result" && "border-l-2 pl-3",
                  msg.type === "error" && "bg-red-500/10 text-red-400 border-l-2 border-red-500 pl-3"
                )}
                style={{
                  borderLeftColor: msg.type === "result" ? agent?.color : undefined,
                }}
              >
                <span className="shrink-0">{agent?.avatar}</span>
                <div className="min-w-0">
                  <span className="font-medium" style={{ color: agent?.color }}>
                    {agent?.name}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            )
          })}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, color }: { status: AgentState["status"]; color: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    idle: { icon: <Clock className="h-3 w-3" />, label: "Waiting", color: "text-muted-foreground" },
    thinking: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Thinking", color: "text-purple-400" },
    working: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Working", color: "text-blue-400" },
    reviewing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Reviewing", color: "text-green-400" },
    done: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Done", color: "text-green-400" },
    error: { icon: <XCircle className="h-3 w-3" />, label: "Error", color: "text-red-400" },
  }

  const c = config[status] || config.idle
  return (
    <span className={cn("flex items-center gap-1 text-[10px] uppercase tracking-wider", c.color)}>
      {c.icon}
      {c.label}
    </span>
  )
}
