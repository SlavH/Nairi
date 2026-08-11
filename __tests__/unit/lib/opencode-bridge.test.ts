/**
 * OpenCode Bridge Tests
 *
 * The bridge no longer performs an HTTP health check at startup. It now
 * coordinates with `webContainerProvider`: it subscribes to boot progress and
 * routes tasks through the WebContainer when it is ready, falling back to the
 * Zen direct API otherwise.
 *
 * These tests mock `@/lib/webcontainer-provider` so the bridge's behavior is
 * exercised against a controllable provider contract, and call
 * `vi.resetModules()` between tests so the bridge singleton does not leak
 * state across cases.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Controllable WebContainer provider mock
// ---------------------------------------------------------------------------
// `vi.hoisted` keeps this object alive across `vi.resetModules()` calls, so the
// mocked `@/lib/webcontainer-provider` module always resolves to this instance.
const providerMock = vi.hoisted(() => {
  type Status =
    | { state: "idle" }
    | { state: "booting" }
    | { state: "ready" }
    | { state: "error"; error: string };

  let status: Status = { state: "idle" };
  let bootError: string | null = null;
  const listeners = new Set<(s: Status) => void>();

  return {
    getStatus: vi.fn(() => status),
    subscribe: vi.fn((listener: (s: Status) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    boot: vi.fn(async () => {
      status = bootError
        ? { state: "error", error: bootError }
        : { state: "ready" };
      listeners.forEach((l) => l(status));
    }),
    createSession: vi.fn(async (opts?: { model?: string }) => ({
      id: "test-session",
      title: "Test Session",
      modelID: opts?.model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    sendMessage: vi.fn(async () => ({
      id: "test-msg",
      sessionID: "test-session",
      role: "assistant",
      parts: [{ type: "text", text: "Generated a todo app" }],
      createdAt: new Date().toISOString(),
    })),
    shutdown: vi.fn(async () => {}),
    __setBootError(error: string | null) {
      bootError = error;
    },
    __reset() {
      status = { state: "idle" };
      bootError = null;
      listeners.clear();
    },
  };
});

vi.mock("@/lib/webcontainer-provider", () => ({
  webContainerProvider: providerMock,
}));

// ---------------------------------------------------------------------------
// Minimal localStorage shim (the bridge persists its config to localStorage)
// ---------------------------------------------------------------------------
class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new LocalStorageMock(),
  configurable: true,
  writable: true,
});

// ---------------------------------------------------------------------------
// Bridge module handle (re-imported per test after module reset)
// ---------------------------------------------------------------------------
let opencodeBridge: typeof import("@/lib/opencode-wasm-bridge")["opencodeBridge"];
let getOpenCodeBridge: typeof import("@/lib/opencode-wasm-bridge")["getOpenCodeBridge"];

describe("OpenCode Bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    providerMock.__reset();
    localStorage.clear();
    global.fetch = vi.fn();

    const mod = await import("@/lib/opencode-wasm-bridge");
    opencodeBridge = mod.opencodeBridge;
    getOpenCodeBridge = mod.getOpenCodeBridge;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = getOpenCodeBridge();
      const instance2 = getOpenCodeBridge();
      expect(instance1).toBe(instance2);
      expect(opencodeBridge).toBe(instance1);
    });
  });

  describe("initialize", () => {
    it("should initialize successfully when WebContainer boots", async () => {
      await opencodeBridge.initialize();
      expect(opencodeBridge.isReady()).toBe(true);
      expect(opencodeBridge.getStatus().initialized).toBe(true);
      expect(providerMock.boot).toHaveBeenCalledTimes(1);
    });

    it("should mark initialized even if WebContainer boot fails", async () => {
      providerMock.__setBootError("WebContainer is not supported");

      await opencodeBridge.initialize();
      expect(opencodeBridge.isReady()).toBe(true);
      expect(opencodeBridge.getStatus().initialized).toBe(true);
    });

    it("should merge config with stored config", async () => {
      localStorage.setItem(
        "opencode-config",
        JSON.stringify({ model: "opencode/stored-model" }),
      );

      await opencodeBridge.initialize({ model: "opencode/deepseek-v4-flash-free" });
      const config = opencodeBridge.getConfig();
      expect(config.model).toBe("opencode/deepseek-v4-flash-free");
    });

    it("should apply stored config when no config is passed", async () => {
      localStorage.setItem(
        "opencode-config",
        JSON.stringify({ model: "opencode/stored-model" }),
      );

      await opencodeBridge.initialize();
      expect(opencodeBridge.getConfig().model).toBe("opencode/stored-model");
    });
  });

  describe("executeTask", () => {
    it("should execute task through WebContainer when ready", async () => {
      await opencodeBridge.initialize();

      const result = await opencodeBridge.executeTask({
        id: "test-1",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe("generate-code");
      expect(result.explanation).toBe("Generated a todo app");
      expect(providerMock.createSession).toHaveBeenCalledWith({
        model: "opencode/big-pickle",
      });
      expect(providerMock.sendMessage).toHaveBeenCalledWith(
        "test-session",
        "Create a todo app",
      );
    });

    it("should reuse the active session for subsequent tasks", async () => {
      await opencodeBridge.initialize();

      await opencodeBridge.executeTask({
        id: "test-1",
        type: "generate-code",
        prompt: "First task",
      });
      await opencodeBridge.executeTask({
        id: "test-2",
        type: "generate-code",
        prompt: "Second task",
      });

      expect(providerMock.createSession).toHaveBeenCalledTimes(1);
    });

    it("should fall back to the Zen API when WebContainer is unavailable", async () => {
      providerMock.__setBootError("WebContainer is not supported");

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          choices: [{ message: { content: "Zen generated code" } }],
        }),
      });

      const result = await opencodeBridge.executeTask({
        id: "test-1",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(true);
      expect(result.explanation).toBe("Zen generated code");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://opencode.ai/zen/v1/chat/completions",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should handle Zen API proxy errors", async () => {
      providerMock.__setBootError("WebContainer is not supported");

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "text/plain" }),
        text: async () => "Internal server error",
      });

      const result = await opencodeBridge.executeTask({
        id: "test-2",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("500");
    });

    it("should handle network errors", async () => {
      providerMock.__setBootError("WebContainer is not supported");

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await opencodeBridge.executeTask({
        id: "test-3",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should auto-generate task ID if not provided", async () => {
      await opencodeBridge.initialize();

      const result = await opencodeBridge.executeTask({
        id: "",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getStatus", () => {
    it("should return status", () => {
      const status = opencodeBridge.getStatus();
      expect(status).toHaveProperty("initialized");
      expect(status).toHaveProperty("model");
      expect(status).toHaveProperty("permissions");
    });

    it("should use free model by default", () => {
      const status = opencodeBridge.getStatus();
      expect(status.model).toBe("opencode/big-pickle");
    });
  });

  describe("getConfig", () => {
    it("should return config", () => {
      const config = opencodeBridge.getConfig();
      expect(config).toHaveProperty("model");
      expect(config).toHaveProperty("permissions");
    });

    it("should use free model by default", () => {
      const config = opencodeBridge.getConfig();
      expect(config.model).toBe("opencode/big-pickle");
    });
  });

  describe("updateConfig", () => {
    it("should update config", async () => {
      await opencodeBridge.updateConfig({ model: "opencode/mimo-v2.5-free" });
      const config = opencodeBridge.getConfig();
      expect(config.model).toBe("opencode/mimo-v2.5-free");
    });

    it("should persist config to localStorage", async () => {
      await opencodeBridge.updateConfig({ model: "opencode/mimo-v2.5-free" });
      const stored = JSON.parse(localStorage.getItem("opencode-config")!);
      expect(stored.model).toBe("opencode/mimo-v2.5-free");
    });

    it("should recreate the session when the model changes", async () => {
      await opencodeBridge.initialize();
      await opencodeBridge.executeTask({
        id: "test-1",
        type: "generate-code",
        prompt: "First task",
      });
      expect(providerMock.createSession).toHaveBeenCalledTimes(1);

      await opencodeBridge.updateConfig({ model: "opencode/mimo-v2.5-free" });
      await opencodeBridge.executeTask({
        id: "test-2",
        type: "generate-code",
        prompt: "Second task",
      });

      expect(providerMock.createSession).toHaveBeenCalledTimes(2);
      expect(providerMock.createSession).toHaveBeenLastCalledWith({
        model: "opencode/mimo-v2.5-free",
      });
    });
  });

  describe("callbacks", () => {
    it("should call onReady callback when boot succeeds", async () => {
      const onReady = vi.fn();
      opencodeBridge.setCallbacks({ onReady });

      await opencodeBridge.initialize();
      expect(onReady).toHaveBeenCalled();
    });

    it("should call onReady callback even when boot fails", async () => {
      providerMock.__setBootError("WebContainer is not supported");
      const onReady = vi.fn();
      opencodeBridge.setCallbacks({ onReady });

      await opencodeBridge.initialize();
      expect(onReady).toHaveBeenCalled();
    });

    it("should call onProgress callback while executing", async () => {
      await opencodeBridge.initialize();
      const onProgress = vi.fn();
      opencodeBridge.setCallbacks({ onProgress });

      await opencodeBridge.executeTask({
        id: "test",
        type: "generate-code",
        prompt: "Test",
      });

      expect(onProgress).toHaveBeenCalled();
    });

    it("should call onComplete callback on success", async () => {
      const onComplete = vi.fn();
      opencodeBridge.setCallbacks({ onComplete });

      await opencodeBridge.initialize();
      await opencodeBridge.executeTask({
        id: "test",
        type: "generate-code",
        prompt: "Test",
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("should call onError callback on failure", async () => {
      providerMock.__setBootError("WebContainer is not supported");
      const onError = vi.fn();
      opencodeBridge.setCallbacks({ onError });

      await opencodeBridge.initialize();

      (global.fetch as any).mockRejectedValueOnce(new Error("Test error"));

      await opencodeBridge.executeTask({
        id: "test",
        type: "generate-code",
        prompt: "Test",
      });

      expect(onError).toHaveBeenCalled();
    });
  });
});
