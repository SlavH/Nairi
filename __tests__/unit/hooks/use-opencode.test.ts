/**
 * useOpenCode Hook Tests
 *
 * The hook is a React hook, so this file runs under the `jsdom` environment
 * (see the pragma below). The `webContainerProvider` dependency is mocked so
 * the real bridge/hook integration is exercised deterministically without an
 * actual WebContainer, and `vi.resetModules()` is called between tests so the
 * bridge singleton does not leak state across cases.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Controllable WebContainer provider mock
// ---------------------------------------------------------------------------
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
// Handles into the freshly-imported module graph (imported after reset)
// ---------------------------------------------------------------------------
let renderHook: typeof import("@testing-library/react")["renderHook"];
let act: typeof import("@testing-library/react")["act"];
let useOpenCode: typeof import("@/hooks/use-opencode")["useOpenCode"];
let DEFAULT_MODEL: string;
let FREE_MODELS: { id: string; name: string }[];

describe("useOpenCode Hook", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    providerMock.__reset();
    localStorage.clear();
    global.fetch = vi.fn();

    // Import RTL and the hook from the same (fresh) module graph so they
    // share a single React instance.
    const rtl = await import("@testing-library/react");
    renderHook = rtl.renderHook;
    act = rtl.act;

    const hookMod = await import("@/hooks/use-opencode");
    useOpenCode = hookMod.useOpenCode;
    DEFAULT_MODEL = hookMod.DEFAULT_MODEL;
    FREE_MODELS = hookMod.FREE_MODELS;
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useOpenCode());

      expect(result.current.initialized).toBe(false);
      expect(result.current.initializing).toBe(false);
      expect(result.current.status.initialized).toBe(false);
      expect(result.current.config.model).toBe(DEFAULT_MODEL);
    });

    it("should use free model by default", () => {
      const { result } = renderHook(() => useOpenCode());
      expect(result.current.config.model).toBe("opencode/big-pickle");
    });

    it("should have free models available", () => {
      expect(FREE_MODELS).toHaveLength(5);
      expect(FREE_MODELS[0].id).toBe("opencode/big-pickle");
    });

    it("should initialize successfully when WebContainer boots", async () => {
      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.initialized).toBe(true);
      expect(result.current.initializing).toBe(false);
      expect(result.current.status.initialized).toBe(true);
      expect(providerMock.boot).toHaveBeenCalledTimes(1);
    });

    it("should initialize successfully even if boot fails", async () => {
      providerMock.__setBootError("WebContainer is not supported");

      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.initialized).toBe(true);
      expect(result.current.status.initialized).toBe(true);
    });

    it("should not initialize twice", async () => {
      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      // Second call should be a no-op
      await act(async () => {
        await result.current.initialize();
      });

      // Only one boot attempt
      expect(providerMock.boot).toHaveBeenCalledTimes(1);
    });
  });

  describe("executeTask", () => {
    it("should execute task successfully through WebContainer", async () => {
      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      let taskResult;
      await act(async () => {
        taskResult = await result.current.executeTask({
          id: "test-1",
          type: "generate-code",
          prompt: "Create a todo app",
        });
      });

      expect(taskResult!.success).toBe(true);
      expect(taskResult!.type).toBe("generate-code");
      expect(taskResult!.explanation).toBe("Generated a todo app");
      expect(providerMock.sendMessage).toHaveBeenCalledWith(
        "test-session",
        "Create a todo app",
      );
    });

    it("should auto-initialize before executing task", async () => {
      const { result } = renderHook(() => useOpenCode());

      let taskResult;
      await act(async () => {
        taskResult = await result.current.executeTask({
          id: "test-2",
          type: "generate-code",
          prompt: "Create a todo app",
        });
      });

      expect(taskResult!.success).toBe(true);
      expect(result.current.initialized).toBe(true);
    });

    it("should handle task execution errors", async () => {
      providerMock.__setBootError("WebContainer is not supported");
      (global.fetch as any).mockRejectedValueOnce(new Error("Task failed"));

      const { result } = renderHook(() => useOpenCode());

      let taskResult;
      await act(async () => {
        taskResult = await result.current.executeTask({
          id: "test-3",
          type: "generate-code",
          prompt: "Create a todo app",
        });
      });

      expect(taskResult!.success).toBe(false);
      expect(taskResult!.error).toContain("Task failed");
    });
  });

  describe("updateConfig", () => {
    it("should update config", async () => {
      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.updateConfig({ model: "opencode/mimo-v2.5-free" });
      });

      expect(result.current.config.model).toBe("opencode/mimo-v2.5-free");
    });
  });

  describe("status", () => {
    it("should return status", () => {
      const { result } = renderHook(() => useOpenCode());

      const status = result.current.status;
      expect(status).toHaveProperty("initialized");
      expect(status).toHaveProperty("model");
      expect(status).toHaveProperty("permissions");
    });

    it("should use free model by default", () => {
      const { result } = renderHook(() => useOpenCode());

      expect(result.current.status.model).toBe(DEFAULT_MODEL);
    });
  });

  describe("config", () => {
    it("should return config", () => {
      const { result } = renderHook(() => useOpenCode());

      const config = result.current.config;
      expect(config).toHaveProperty("model");
      expect(config).toHaveProperty("permissions");
    });

    it("should use free model by default", () => {
      const { result } = renderHook(() => useOpenCode());

      expect(result.current.config.model).toBe(DEFAULT_MODEL);
    });

    it("should default all permissions to 'ask' for security", () => {
      const { result } = renderHook(() => useOpenCode());

      const permissions = result.current.config.permissions;
      expect(permissions.bash).toBe("ask");
      expect(permissions.read).toBe("ask");
      expect(permissions.edit).toBe("ask");
      expect(permissions.write).toBe("ask");
      expect(permissions.glob).toBe("ask");
      expect(permissions.grep).toBe("ask");
      expect(permissions.webfetch).toBe("ask");
      expect(permissions.websearch).toBe("ask");
    });
  });
});
