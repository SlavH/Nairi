export interface WorkspaceInfo {
  userId: string
  basePath: string
  projectPath: string
}

export interface WorkspaceSession {
  sessionId: string
  userId: string
  workspacePath: string
  createdAt: Date
}
