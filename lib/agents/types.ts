export interface AgentState {
  id: "planner" | "builder" | "critic"
  name: string
  role: string
  avatar: string
  color: string
  status: "idle" | "thinking" | "working" | "reviewing" | "done" | "error"
  currentThought: string
  completedSteps: number
  totalSteps: number
}

export interface FactoryTask {
  id: string
  title: string
  agent: "planner" | "builder" | "critic"
  status: "pending" | "in-progress" | "completed" | "failed"
}

export interface FactoryPlan {
  id: string
  tasks: FactoryTask[]
  status: "planning" | "building" | "reviewing" | "fixing" | "completed" | "failed"
}

export interface FileArtifact {
  path: string
  content: string
  language: string
  name?: string
}

export interface AgentMessage {
  id: string
  agent: "planner" | "builder" | "critic"
  type: "thought" | "action" | "result" | "error"
  content: string
  timestamp: number
}

export type FactoryStreamUpdate =
  | { type: "agent-state"; agent: AgentState }
  | { type: "agent-thought"; agent: "planner" | "builder" | "critic"; thought: string }
  | { type: "plan"; plan: FactoryPlan }
  | { type: "task-update"; taskId: string; status: FactoryTask["status"] }
  | { type: "file-update"; file: FileArtifact }
  | { type: "critic-review"; issues: string[]; verdict: "approve" | "fix" }
  | { type: "message"; agent: "planner" | "builder" | "critic"; content: string }
  | { type: "complete" }
  | { type: "error"; content: string }
