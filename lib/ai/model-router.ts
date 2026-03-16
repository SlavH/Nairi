/**
 * All AI requests go to Colab (BITNET_BASE_URL). Single provider/model from env.
 */

export type TaskType = "chat" | "code" | "image" | "long-context"

export type RoutingPreference = "latency" | "cost" | "quality"

export interface RouterResult {
  taskType: TaskType
  preferredProviderId: string
  preferredModelId: string
  preferFast: boolean
  preference: RoutingPreference
}

const PROVIDER_ID = "bitnet"
const MODEL_ID = process.env.BITNET_MODEL || "default"

export function routeModel(
  _taskType: TaskType,
  _preference: RoutingPreference = "latency"
): RouterResult {
  return {
    taskType: _taskType,
    preferredProviderId: PROVIDER_ID,
    preferredModelId: MODEL_ID,
    preferFast: true,
    preference: _preference,
  }
}

export function routeForChat(preference?: RoutingPreference): RouterResult {
  return routeModel("chat", preference ?? "latency")
}

export function routeForCode(preference?: RoutingPreference): RouterResult {
  return routeModel("code", preference ?? "quality")
}

export function routeForLongContext(preference?: RoutingPreference): RouterResult {
  return routeModel("long-context", preference ?? "quality")
}
