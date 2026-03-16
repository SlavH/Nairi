/**
 * Tool/function calling: standardize tool definitions and execution.
 */
export interface ToolDef {
  name: string
  description: string
  parameters?: Record<string, unknown>
}
export interface ToolCall {
  name: string
  args: Record<string, unknown>
}
export function validateToolCall(_def: ToolDef, _call: ToolCall): boolean {
  return true
}
