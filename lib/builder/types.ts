/**
 * Type definitions for Builder V2
 */

// ---------------------------------------------------------------------------
// Builder page / UI state types
// ---------------------------------------------------------------------------

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: "typescript" | "javascript" | "css" | "json" | "markdown"
  isModified: boolean
}

export interface ProjectFolder {
  id: string
  name: string
  path: string
  children: (ProjectFile | ProjectFolder)[]
  isExpanded: boolean
}

export interface Task {
  id: string
  title: string
  status: "pending" | "in-progress" | "completed" | "failed"
  description?: string
  subtasks?: Task[]
}

export interface BuildPlan {
  id: string
  title: string
  tasks: Task[]
  status: "planning" | "executing" | "completed" | "failed"
  createdAt: Date
}

export interface ProjectVersion {
  id: string
  name: string
  description: string
  files: ProjectFile[]
  createdAt: Date
  isCurrent: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  attachments?: { type: "image" | "file"; url: string; name: string }[]
  buildPlan?: BuildPlan
  codeChanges?: { file: string; diff: string }[]
}

export type ViewportSize = "mobile" | "tablet" | "desktop"
export type RightPanelTab = "preview" | "code" | "tools" | "cli"
export type RightSidePanelTab = "tools" | "cli"
export type LeftPanelTab = "chat" | "files" | "tasks" | "history"

// ---------------------------------------------------------------------------
// Generate API request / stream types
// ---------------------------------------------------------------------------

export interface GenerateRequest {
  prompt: string
  currentFiles: {
    id: string
    name: string
    path: string
    content: string
    language: string
  }[]
  conversationHistory: {
    role: string
    content: string
  }[]
}

export interface TaskUpdate {
  type: "task-update"
  taskId: string
  status: "pending" | "in-progress" | "completed" | "failed"
}

export interface FileUpdate {
  type: "file-update"
  file: {
    id: string
    name: string
    path: string
    content: string
    language: string
  }
}

export interface MessageUpdate {
  type: "message"
  content: string
}

export interface CompleteUpdate {
  type: "complete"
}

export interface PlanUpdate {
  type: "plan"
  tasks: { id: string; title: string; status: string }[]
}

export type StreamUpdate = TaskUpdate | FileUpdate | MessageUpdate | CompleteUpdate | PlanUpdate
