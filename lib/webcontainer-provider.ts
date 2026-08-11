"use client"

import { WebContainer, type FileSystemTree } from "@webcontainer/api"

import { getOpenCodeClient, type Session, type Message } from "@/lib/opencode-client"

type ProviderStatus =
  | { state: "idle" }
  | { state: "booting" }
  | { state: "ready"; container: WebContainer; baseUrl: string; session?: Session }
  | { state: "error"; error: string }

type StatusListener = (status: ProviderStatus) => void

class WebContainerProvider {
  private static instance: WebContainerProvider
  private status: ProviderStatus = { state: "idle" }
  private listeners: Set<StatusListener> = new Set()

  private constructor() {}

  static getInstance(): WebContainerProvider {
    if (!WebContainerProvider.instance) {
      WebContainerProvider.instance = new WebContainerProvider()
    }
    return WebContainerProvider.instance
  }

  getStatus(): ProviderStatus {
    return this.status
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((l) => l(this.status))
  }

  async boot() {
    if (this.status.state === "ready" || this.status.state === "booting") return

    this.status = { state: "booting" }
    this.notify()

    // Check browser support before attempting to boot
    if (typeof WebContainer === "undefined" || !(WebContainer as unknown as { isSupported?: () => boolean }).isSupported?.()) {
      this.status = {
        state: "error",
        error: "WebContainer is not supported in this browser. Please use Chrome, Edge, or Firefox (not Safari).",
      }
      this.notify()
      return
    }

    try {
      // Boot with timeout (90s)
      const container = await Promise.race<WebContainer>([
        WebContainer.boot(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("WebContainer boot timeout (90s). Try refreshing or using a different browser.")), 90_000)
        ),
      ])

      // Fetch and read the OpenCode files
      const pkgResp = await fetch("/opencode-webcontainer/package.json")
      const pkgJson = await pkgResp.text()
      const configResp = await fetch("/opencode-webcontainer/opencode.json")
      const opencodeJson = await configResp.text()
      const startResp = await fetch("/opencode-webcontainer/start.mjs")
      const startMjs = await startResp.text()
      const toolResp = await fetch("/opencode-webcontainer/.opencode/tools/generate-image.mjs")
      const generateImageMjs = await toolResp.text()

      // Mount files into the WebContainer filesystem
      const tree: FileSystemTree = {
        "package.json": { file: { contents: pkgJson } },
        "opencode.json": { file: { contents: opencodeJson } },
        "start.mjs": { file: { contents: startMjs } },
        ".opencode": {
          directory: {
            tools: {
              directory: {
                "generate-image.mjs": { file: { contents: generateImageMjs } },
              },
            },
          },
        },
      }
      await container.mount(tree)

      // Install dependencies with timeout (120s)
      const installProcess = await container.spawn("npm", ["install"])
      const installExit = await Promise.race<number>([
        installProcess.exit,
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            installProcess.kill()
            reject(new Error("npm install timeout (120s). The package registry may be slow."))
          }, 120_000)
        ),
      ])
      if (installExit !== 0) throw new Error(`npm install exited with ${installExit}`)

      // Start OpenCode server
      const serverProcess = await container.spawn("node", ["start.mjs"])

      // Capture logs
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("[OpenCode WebContainer]", data)
          },
        })
      )

      // Wait for server to be ready
      const serverUrl = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Server startup timeout (30s)")), 30_000)

        container.on("server-ready", (port, url) => {
          if (port === 4096) {
            clearTimeout(timeout)
            resolve(url)
          }
        })
      })

      // Update the global OpenCode client to point to WebContainer
      getOpenCodeClient(serverUrl)

      this.status = {
        state: "ready",
        container,
        baseUrl: serverUrl,
      }
      this.notify()
    } catch (err) {
      this.status = {
        state: "error",
        error: err instanceof Error ? err.message : String(err),
      }
      this.notify()
    }
  }

  async createSession(opts?: { model?: string }): Promise<Session> {
    if (this.status.state !== "ready") throw new Error("Provider not ready")

    const client = getOpenCodeClient(this.status.baseUrl)
    const session = await client.createSession({
      model: opts?.model || "opencode/big-pickle",
    })
    return session
  }

  async sendMessage(sessionId: string, message: string): Promise<Message> {
    if (this.status.state !== "ready") throw new Error("Provider not ready")

    const client = getOpenCodeClient(this.status.baseUrl)
    const response = await client.sendMessage(sessionId, [
      { type: "text", text: message } as any,
    ])
    return response
  }

  getClient() {
    if (this.status.state !== "ready") throw new Error("Provider not ready")
    return getOpenCodeClient(this.status.baseUrl)
  }

  async shutdown() {
    if (this.status.state === "ready") {
      this.status.container.teardown()
    }
    this.status = { state: "idle" }
    this.notify()
  }
}

export const webContainerProvider = WebContainerProvider.getInstance()

export function useWebContainer() {
  return webContainerProvider
}
