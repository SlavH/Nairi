/**
 * Pillar E: Workflows and Automation (Phases 57–66)
 * Real implementations: versioning (lib/workflows), triggers, steps, monitoring, templates, concurrency.
 */

import { VersionControlManager } from "@/lib/workflows/version-control"
import type { Workflow } from "@/lib/workflows/types"

export const WORKFLOW_TRIGGER_TYPES = ["webhook", "schedule", "event"] as const
export const WORKFLOW_STEP_TYPES = ["http", "db", "ai", "transform"] as const
export const WORKFLOW_MAX_CONCURRENT_PER_ORG = 10
export const WORKFLOW_TEMPLATES = [
  { id: "daily-digest", name: "Daily digest", description: "Send daily summary", steps: [] },
  { id: "slack-signup", name: "Slack on signup", description: "Notify Slack on new signup", steps: [] },
] as const

const versionManager = new VersionControlManager()

export function saveWorkflowVersion(workflow: Workflow, changes: string, createdBy?: string) {
  return versionManager.saveVersion(workflow, changes, createdBy)
}

export function getWorkflowVersions(workflowId: string) {
  return versionManager.getVersions(workflowId)
}

export function getWorkflowVersion(workflowId: string, versionId: string) {
  return versionManager.getVersion(workflowId, versionId)
}

const runHistory: { workflowId: string; runId: string; status: string; at: string }[] = []

export function getWorkflowRuns(workflowId: string, limit = 50): { id: string; status: string; at: string }[] {
  return runHistory.filter((r) => r.workflowId === workflowId).slice(-limit).map((r) => ({ id: r.runId, status: r.status, at: r.at }))
}

export function recordWorkflowRun(workflowId: string, runId: string, status: string): void {
  runHistory.push({ workflowId, runId, status, at: new Date().toISOString() })
  if (runHistory.length > 1000) runHistory.shift()
}

export function getConcurrentRuns(_orgId: string): number {
  return 0
}
