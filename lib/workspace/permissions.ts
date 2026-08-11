import { WorkspaceManager } from './manager'

export function validateWorkspaceAccess(userId: string | null, requestedPath: string): boolean {
  if (!userId) return false
  return WorkspaceManager.isPathInWorkspace(userId, requestedPath)
}
