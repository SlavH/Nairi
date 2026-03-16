/**
 * Nairi API – re-export of router (generate, checkStatus, getResult, pollForResult).
 * Use: import { generate, pollForResult } from '@/lib/nairiApi'
 */

export {
  isRouterConfigured,
  generate,
  checkStatus,
  getResult,
  pollForResult,
} from "@/lib/nairi-api/router"
export type { NairiRouterGenerationType, NairiRouterGenerateResponse, NairiRouterStatusResponse, NairiRouterResultResponse } from "@/lib/nairi-api/types"
