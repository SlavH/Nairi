/**
 * Unified OpenCode Client
 * Typed client for all OpenCode server API interactions
 */

const OPENCODE_API_URL = process.env.OPENCODE_API_URL || "http://localhost:4096"
const OPENCODE_TIMEOUT = 120000

// Types
export interface Session {
  id: string
  title: string
  modelID?: string
  providerID?: string
  agentID?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface Message {
  id: string
  sessionID: string
  role: "user" | "assistant" | "system"
  parts: MessagePart[]
  modelID?: string
  providerID?: string
  createdAt: string
  completedAt?: string
}

export interface MessagePart {
  type: "text" | "tool-call" | "tool-result" | "error"
  text?: string
  tool?: string
  args?: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}

export interface FileContent {
  content: string
  path: string
}

export interface FileStatus {
  path: string
  status: "added" | "modified" | "deleted" | "renamed"
}

export interface VcsInfo {
  branch: string
  remote?: string
  commit?: string
}

export interface Diff {
  files: DiffFile[]
  raw: string
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: string[]
}

export interface Tool {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface Permission {
  id: string
  sessionID: string
  tool: string
  pattern: string
  status: "pending" | "approved" | "denied"
  createdAt: string
}

export interface Question {
  id: string
  sessionID: string
  question: string
  header: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
  createdAt: string
}

export interface QuestionOption {
  label: string
  description?: string
}

export interface McpStatus {
  name: string
  status: "connected" | "disconnected" | "error"
  tools: string[]
}

export interface Agent {
  id: string
  name: string
  description: string
  mode: "primary" | "subagent" | "all"
}

export interface Skill {
  name: string
  description: string
  files: string[]
}

export interface Shell {
  name: string
  path: string
}

export interface Pty {
  id: string
  shell: string
  createdAt: string
}

export interface Worktree {
  id: string
  branch: string
  path: string
}

export interface Config {
  model?: string
  provider?: Record<string, unknown>
  permission?: Record<string, string>
  mcp?: Record<string, unknown>
}

export interface Provider {
  id: string
  name: string
  connected: boolean
  models: string[]
}

export interface OpenCodeEvent {
  type: string
  sessionID?: string
  messageID?: string
  data?: unknown
  timestamp: string
}

// Client class
export class OpenCodeClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || OPENCODE_API_URL
    this.timeout = timeout || OPENCODE_TIMEOUT
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenCode API error (${response.status}): ${error}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        return response.json()
      }
      return response.text() as unknown as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Session methods
  async createSession(opts?: {
    model?: string
    agent?: string
    location?: string
  }): Promise<Session> {
    return this.request("POST", "/session", opts)
  }

  async listSessions(opts?: {
    scope?: string
    search?: string
    limit?: number
  }): Promise<Session[]> {
    const params: Record<string, string> = {}
    if (opts?.scope) params.scope = opts.scope
    if (opts?.search) params.search = opts.search
    if (opts?.limit) params.limit = String(opts.limit)
    return this.request("GET", "/session", undefined, params)
  }

  async getSession(id: string): Promise<Session> {
    return this.request("GET", `/session/${id}`)
  }

  async updateSession(
    id: string,
    updates: { title?: string; archivedAt?: string }
  ): Promise<Session> {
    return this.request("PATCH", `/session/${id}`, updates)
  }

  async deleteSession(id: string): Promise<void> {
    await this.request("DELETE", `/session/${id}`)
  }

  async forkSession(
    id: string,
    messageId?: string
  ): Promise<Session> {
    return this.request("POST", `/session/${id}/fork`, { messageId })
  }

  async getSessionStatus(): Promise<
    Record<string, { status: string }>
  > {
    return this.request("GET", "/session/status")
  }

  // Messaging methods
  async sendMessage(
    sessionId: string,
    parts: MessagePart[],
    opts?: {
      model?: { providerID: string; modelID: string }
      agent?: string
    }
  ): Promise<Message> {
    return this.request("POST", `/session/${sessionId}/message`, {
      parts,
      ...opts,
    })
  }

  async sendAsyncMessage(
    sessionId: string,
    parts: MessagePart[],
    opts?: {
      model?: { providerID: string; modelID: string }
      agent?: string
    }
  ): Promise<void> {
    await this.request("POST", `/session/${sessionId}/prompt_async`, {
      parts,
      ...opts,
    })
  }

  async getMessages(
    sessionId: string,
    opts?: { before?: string; limit?: number }
  ): Promise<Message[]> {
    const params: Record<string, string> = {}
    if (opts?.before) params.before = opts.before
    if (opts?.limit) params.limit = String(opts.limit)
    return this.request("GET", `/session/${sessionId}/message`, undefined, params)
  }

  async getMessage(sessionId: string, messageId: string): Promise<Message> {
    return this.request("GET", `/session/${sessionId}/message/${messageId}`)
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    await this.request("DELETE", `/session/${sessionId}/message/${messageId}`)
  }

  async abortSession(sessionId: string): Promise<void> {
    await this.request("POST", `/session/${sessionId}/abort`)
  }

  async revertMessage(sessionId: string, messageId: string): Promise<void> {
    await this.request("POST", `/session/${sessionId}/revert`, { messageId })
  }

  async unrevertSession(sessionId: string): Promise<void> {
    await this.request("POST", `/session/${sessionId}/unrevert`)
  }

  async summarizeSession(sessionId: string): Promise<void> {
    await this.request("POST", `/session/${sessionId}/summarize`)
  }

  async initSession(sessionId: string): Promise<void> {
    await this.request("POST", `/session/${sessionId}/init`)
  }

  async getSessionDiff(sessionId: string, messageId?: string): Promise<Diff> {
    const params: Record<string, string> = {}
    if (messageId) params.messageID = messageId
    return this.request("GET", `/session/${sessionId}/diff`, undefined, params)
  }

  async getSessionTodo(
    sessionId: string
  ): Promise<Array<{ id: string; content: string; status: string }>> {
    return this.request("GET", `/session/${sessionId}/todo`)
  }

  async shareSession(sessionId: string): Promise<{ url: string }> {
    return this.request("POST", `/session/${sessionId}/share`)
  }

  async unshareSession(sessionId: string): Promise<void> {
    await this.request("DELETE", `/session/${sessionId}/share`)
  }

  // File methods
  async listFiles(path?: string): Promise<FileNode[]> {
    const params: Record<string, string> = {}
    if (path) params.path = path
    return this.request("GET", "/file", undefined, params)
  }

  async readFile(path: string): Promise<FileContent> {
    return this.request("GET", "/file/content", undefined, { path })
  }

  async searchFiles(query: string): Promise<string[]> {
    return this.request("GET", "/find/file", undefined, { query })
  }

  async searchContent(pattern: string): Promise<
    Array<{ file: string; line: number; content: string }>
  > {
    return this.request("GET", "/find", undefined, { pattern })
  }

  async searchSymbols(query: string): Promise<
    Array<{ name: string; kind: string; location: { file: string; line: number } }>
  > {
    return this.request("GET", "/find/symbol", undefined, { query })
  }

  async getFileStatus(): Promise<FileStatus[]> {
    return this.request("GET", "/file/status")
  }

  // VCS methods
  async getVcsInfo(): Promise<VcsInfo> {
    return this.request("GET", "/vcs")
  }

  async getVcsStatus(): Promise<FileStatus[]> {
    return this.request("GET", "/vcs/status")
  }

  async getVcsDiff(base?: string): Promise<Diff> {
    const params: Record<string, string> = {}
    if (base) params.base = base
    return this.request("GET", "/vcs/diff", undefined, params)
  }

  async getVcsDiffRaw(): Promise<string> {
    return this.request("GET", "/vcs/diff/raw")
  }

  async applyPatch(patch: string): Promise<void> {
    await this.request("POST", "/vcs/apply", { patch })
  }

  // Tool methods
  async listTools(provider?: string, model?: string): Promise<Tool[]> {
    const params: Record<string, string> = {}
    if (provider) params.provider = provider
    if (model) params.model = model
    return this.request("GET", "/experimental/tool", undefined, params)
  }

  async listToolIds(): Promise<string[]> {
    return this.request("GET", "/experimental/tool/ids")
  }

  // Permission methods
  async listPermissions(): Promise<Permission[]> {
    return this.request("GET", "/permission")
  }

  async replyPermission(
    requestId: string,
    reply: "once" | "always" | "reject",
    message?: string
  ): Promise<void> {
    await this.request("POST", `/permission/${requestId}/reply`, {
      reply,
      message,
    })
  }

  // Question methods
  async listQuestions(): Promise<Question[]> {
    return this.request("GET", "/question")
  }

  async replyQuestion(
    requestId: string,
    answers: string[][]
  ): Promise<void> {
    await this.request("POST", `/question/${requestId}/reply`, { answers })
  }

  async rejectQuestion(requestId: string): Promise<void> {
    await this.request("POST", `/question/${requestId}/reject`)
  }

  // MCP methods
  async listMcpServers(): Promise<McpStatus[]> {
    return this.request("GET", "/mcp")
  }

  async addMcpServer(
    name: string,
    config: Record<string, unknown>
  ): Promise<McpStatus> {
    return this.request("POST", "/mcp", { name, config })
  }

  async connectMcpServer(name: string): Promise<void> {
    await this.request("POST", `/mcp/${name}/connect`)
  }

  async disconnectMcpServer(name: string): Promise<void> {
    await this.request("POST", `/mcp/${name}/disconnect`)
  }

  // Agent methods
  async listAgents(): Promise<Agent[]> {
    return this.request("GET", "/agent")
  }

  // Skill methods
  async listSkills(): Promise<Skill[]> {
    return this.request("GET", "/skill")
  }

  // PTY methods
  async listShells(): Promise<Shell[]> {
    return this.request("GET", "/pty/shells")
  }

  async listPtySessions(): Promise<Pty[]> {
    return this.request("GET", "/pty")
  }

  async createPty(shell?: string): Promise<Pty> {
    return this.request("POST", "/pty", { shell })
  }

  async getPty(id: string): Promise<Pty> {
    return this.request("GET", `/pty/${id}`)
  }

  async deletePty(id: string): Promise<void> {
    await this.request("DELETE", `/pty/${id}`)
  }

  async getPtyConnectToken(id: string): Promise<{ token: string }> {
    return this.request("POST", `/pty/${id}/connect-token`)
  }

  // Config methods
  async getConfig(): Promise<Config> {
    return this.request("GET", "/config")
  }

  async updateConfig(patch: Partial<Config>): Promise<Config> {
    return this.request("PATCH", "/config", patch)
  }

  async listProviders(): Promise<Provider[]> {
    return this.request("GET", "/config/providers")
  }

  // Project methods
  async listProjects(): Promise<
    Array<{ id: string; name: string; path: string }>
  > {
    return this.request("GET", "/project")
  }

  async getCurrentProject(): Promise<{
    id: string
    name: string
    path: string
  }> {
    return this.request("GET", "/project/current")
  }

  async initGit(): Promise<void> {
    await this.request("POST", "/project/git/init")
  }

  // Path methods
  async getPath(): Promise<{
    home: string
    state: string
    config: string
    worktree: string
    directory: string
  }> {
    return this.request("GET", "/path")
  }

  // Health methods
  async health(): Promise<{ healthy: boolean; version: string }> {
    return this.request("GET", "/global/health")
  }

  // Global config
  async getGlobalConfig(): Promise<Config> {
    return this.request("GET", "/global/config")
  }

  async updateGlobalConfig(patch: Partial<Config>): Promise<Config> {
    return this.request("PATCH", "/global/config", patch)
  }

  // Auth methods
  async setAuth(
    providerId: string,
    credentials: Record<string, string>
  ): Promise<void> {
    await this.request("PUT", `/auth/${providerId}`, credentials)
  }

  async removeAuth(providerId: string): Promise<void> {
    await this.request("DELETE", `/auth/${providerId}`)
  }

  // LSP methods
  async getLspStatus(): Promise<
    Array<{ name: string; status: string; capabilities: string[] }>
  > {
    return this.request("GET", "/lsp")
  }

  // Formatter methods
  async getFormatterStatus(): Promise<
    Array<{ name: string; status: string }>
  > {
    return this.request("GET", "/formatter")
  }

  // Command methods
  async listCommands(): Promise<
    Array<{ id: string; name: string; description: string }>
  > {
    return this.request("GET", "/command")
  }

  // Worktree methods (experimental)
  async listWorktrees(): Promise<Worktree[]> {
    return this.request("GET", "/experimental/worktree")
  }

  async createWorktree(branch?: string): Promise<Worktree> {
    return this.request("POST", "/experimental/worktree", { branch })
  }

  async deleteWorktree(id: string): Promise<void> {
    await this.request("DELETE", `/experimental/worktree/${id}`)
  }

  async resetWorktree(id: string): Promise<void> {
    await this.request("POST", `/experimental/worktree/${id}/reset`)
  }

  // Resource methods (experimental)
  async listResources(): Promise<
    Array<{ name: string; uri: string; mimeType?: string }>
  > {
    return this.request("GET", "/experimental/resource")
  }

  // SSE Event subscription (returns EventSource URL)
  getEventSourceUrl(sessionId?: string): string {
    if (sessionId) {
      return `${this.baseUrl}/session/${sessionId}/events`
    }
    return `${this.baseUrl}/event`
  }

  getGlobalEventSourceUrl(): string {
    return `${this.baseUrl}/global/event`
  }
}

// Singleton instance
let clientInstance: OpenCodeClient | null = null

export function getOpenCodeClient(baseUrl?: string): OpenCodeClient {
  if (!clientInstance) {
    clientInstance = new OpenCodeClient(baseUrl)
  } else if (baseUrl && clientInstance.getBaseUrl() !== baseUrl) {
    // Re-create with new base URL (e.g., after WebContainer boot)
    clientInstance = new OpenCodeClient(baseUrl)
  }
  return clientInstance
}

export function getClientBaseUrl(): string {
  return clientInstance?.getBaseUrl() || OPENCODE_API_URL
}

export function createOpenCodeClient(
  baseUrl?: string,
  timeout?: number
): OpenCodeClient {
  return new OpenCodeClient(baseUrl, timeout)
}
