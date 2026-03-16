/**
 * Nairi AI Workflow Builder - Version Control System
 * Track changes and restore previous workflow states
 */

import { Workflow, WorkflowVersion } from './types'

// ============================================================================
// Version Control Manager
// ============================================================================

export class VersionControlManager {
  private versions: Map<string, WorkflowVersion[]> = new Map()
  private maxVersionsPerWorkflow: number = 50

  // ============================================================================
  // Version Management
  // ============================================================================

  saveVersion(
    workflow: Workflow,
    changes: string,
    createdBy?: string
  ): WorkflowVersion {
    const version: WorkflowVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      version: this.generateVersionNumber(workflow.id),
      snapshot: JSON.parse(JSON.stringify(workflow)),
      changes,
      createdAt: new Date(),
      createdBy,
      isPublished: false,
    }

    // Get or create version array for this workflow
    if (!this.versions.has(workflow.id)) {
      this.versions.set(workflow.id, [])
    }

    const workflowVersions = this.versions.get(workflow.id)!
    workflowVersions.push(version)

    // Trim old versions if exceeding limit
    if (workflowVersions.length > this.maxVersionsPerWorkflow) {
      workflowVersions.shift()
    }

    return version
  }

  getVersions(workflowId: string): WorkflowVersion[] {
    return this.versions.get(workflowId) || []
  }

  getVersion(workflowId: string, versionId: string): WorkflowVersion | undefined {
    const versions = this.versions.get(workflowId)
    return versions?.find(v => v.id === versionId)
  }

  getLatestVersion(workflowId: string): WorkflowVersion | undefined {
    const versions = this.versions.get(workflowId)
    return versions?.[versions.length - 1]
  }

  restoreVersion(workflowId: string, versionId: string): Workflow | undefined {
    const version = this.getVersion(workflowId, versionId)
    if (!version) return undefined

    // Return a deep copy of the snapshot
    return JSON.parse(JSON.stringify(version.snapshot))
  }

  deleteVersion(workflowId: string, versionId: string): boolean {
    const versions = this.versions.get(workflowId)
    if (!versions) return false

    const index = versions.findIndex(v => v.id === versionId)
    if (index === -1) return false

    versions.splice(index, 1)
    return true
  }

  clearVersions(workflowId: string): void {
    this.versions.delete(workflowId)
  }

  // ============================================================================
  // Publishing
  // ============================================================================

  publishVersion(workflowId: string, versionId: string): boolean {
    const version = this.getVersion(workflowId, versionId)
    if (!version) return false

    // Unpublish all other versions
    const versions = this.versions.get(workflowId)
    versions?.forEach(v => {
      v.isPublished = v.id === versionId
    })

    return true
  }

  getPublishedVersion(workflowId: string): WorkflowVersion | undefined {
    const versions = this.versions.get(workflowId)
    return versions?.find(v => v.isPublished)
  }

  // ============================================================================
  // Diff & Comparison
  // ============================================================================

  compareVersions(
    workflowId: string,
    versionId1: string,
    versionId2: string
  ): VersionDiff | undefined {
    const v1 = this.getVersion(workflowId, versionId1)
    const v2 = this.getVersion(workflowId, versionId2)

    if (!v1 || !v2) return undefined

    return this.diffWorkflows(v1.snapshot, v2.snapshot)
  }

  private diffWorkflows(w1: Workflow, w2: Workflow): VersionDiff {
    const diff: VersionDiff = {
      nodesAdded: [],
      nodesRemoved: [],
      nodesModified: [],
      edgesAdded: [],
      edgesRemoved: [],
      settingsChanged: false,
      variablesChanged: false,
    }

    // Compare nodes
    const w1NodeIds = new Set(w1.nodes.map(n => n.id))
    const w2NodeIds = new Set(w2.nodes.map(n => n.id))

    // Find added nodes
    w2.nodes.forEach(node => {
      if (!w1NodeIds.has(node.id)) {
        diff.nodesAdded.push(node.id)
      }
    })

    // Find removed nodes
    w1.nodes.forEach(node => {
      if (!w2NodeIds.has(node.id)) {
        diff.nodesRemoved.push(node.id)
      }
    })

    // Find modified nodes
    w1.nodes.forEach(node => {
      if (w2NodeIds.has(node.id)) {
        const w2Node = w2.nodes.find(n => n.id === node.id)
        if (w2Node && JSON.stringify(node) !== JSON.stringify(w2Node)) {
          diff.nodesModified.push(node.id)
        }
      }
    })

    // Compare edges
    const w1EdgeIds = new Set(w1.edges.map(e => e.id))
    const w2EdgeIds = new Set(w2.edges.map(e => e.id))

    w2.edges.forEach(edge => {
      if (!w1EdgeIds.has(edge.id)) {
        diff.edgesAdded.push(edge.id)
      }
    })

    w1.edges.forEach(edge => {
      if (!w2EdgeIds.has(edge.id)) {
        diff.edgesRemoved.push(edge.id)
      }
    })

    // Compare settings
    diff.settingsChanged = JSON.stringify(w1.settings) !== JSON.stringify(w2.settings)

    // Compare variables
    diff.variablesChanged = JSON.stringify(w1.variables) !== JSON.stringify(w2.variables)

    return diff
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private generateVersionNumber(workflowId: string): string {
    const versions = this.versions.get(workflowId) || []
    const count = versions.length + 1
    const now = new Date()
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${count}`
  }

  // ============================================================================
  // Export/Import
  // ============================================================================

  exportVersionHistory(workflowId: string): string {
    const versions = this.versions.get(workflowId) || []
    return JSON.stringify(versions, null, 2)
  }

  importVersionHistory(workflowId: string, json: string): void {
    const versions = JSON.parse(json) as WorkflowVersion[]
    this.versions.set(workflowId, versions)
  }
}

// ============================================================================
// Types
// ============================================================================

export interface VersionDiff {
  nodesAdded: string[]
  nodesRemoved: string[]
  nodesModified: string[]
  edgesAdded: string[]
  edgesRemoved: string[]
  settingsChanged: boolean
  variablesChanged: boolean
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const versionControl = new VersionControlManager()

// ============================================================================
// Auto-save functionality
// ============================================================================

export class AutoSaveManager {
  private saveInterval: NodeJS.Timeout | null = null
  private lastSavedState: string = ''
  private onSave: ((workflow: Workflow) => void) | null = null

  start(workflow: Workflow, intervalMs: number = 30000, onSave?: (workflow: Workflow) => void): void {
    this.stop()
    this.lastSavedState = JSON.stringify(workflow)
    this.onSave = onSave || null

    this.saveInterval = setInterval(() => {
      const currentState = JSON.stringify(workflow)
      if (currentState !== this.lastSavedState) {
        versionControl.saveVersion(workflow, 'Auto-save')
        this.lastSavedState = currentState
        this.onSave?.(workflow)
      }
    }, intervalMs)
  }

  stop(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }
  }

  forceSave(workflow: Workflow, changes: string = 'Manual save'): WorkflowVersion {
    const version = versionControl.saveVersion(workflow, changes)
    this.lastSavedState = JSON.stringify(workflow)
    return version
  }
}

export const autoSave = new AutoSaveManager()
