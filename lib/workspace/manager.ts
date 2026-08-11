import * as path from 'path'
import * as fs from 'fs/promises'

const WORKSPACE_BASE = process.env.WORKSPACE_BASE_PATH || '/workspaces'

export class WorkspaceManager {
  static getWorkspacePath(userId: string): string {
    return path.join(WORKSPACE_BASE, userId, 'project')
  }

  static async ensureWorkspace(userId: string): Promise<string> {
    const wsPath = this.getWorkspacePath(userId)
    await fs.mkdir(wsPath, { recursive: true })
    return wsPath
  }

  static isPathInWorkspace(userId: string, targetPath: string): boolean {
    const wsPath = path.resolve(this.getWorkspacePath(userId))
    const resolved = path.resolve(targetPath)
    return resolved.startsWith(wsPath)
  }
}
