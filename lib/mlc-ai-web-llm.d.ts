/** Type declarations for optional dependency @mlc-ai/web-llm */
declare module '@mlc-ai/web-llm' {
  export function CreateMLCEngine(
    modelId: string,
    options?: { initProgressCallback?: (progress: { progress: number; text?: string }) => void }
  ): Promise<unknown>
}
