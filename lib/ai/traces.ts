/**
 * Multi-turn reasoning traces: log chain-of-thought or tool-call sequences for debugging and quality review.
 * Align with app/api/traces and execution traces.
 */

export interface ReasoningStep {
  step: number
  type: "tool_call" | "thought" | "result"
  payload: string | Record<string, unknown>
  ts: number
}

const steps: ReasoningStep[] = []

export function appendReasoningStep(step: Omit<ReasoningStep, "ts">): void {
  steps.push({ ...step, ts: Date.now() })
}

export function getReasoningTrace(): ReasoningStep[] {
  return [...steps]
}

export function clearReasoningTrace(): void {
  steps.length = 0
}
