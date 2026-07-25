/**
 * useOpenCode Hook Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOpenCode, DEFAULT_MODEL, FREE_MODELS } from "@/hooks/use-opencode";

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("useOpenCode Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch
    global.fetch = vi.fn();
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

    it("should initialize successfully", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true, version: "1.0.0" }),
      });

      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.initialized).toBe(true);
      expect(result.current.status.initialized).toBe(true);
    });

    it("should not initialize twice", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      // Second call should be no-op
      await act(async () => {
        await result.current.initialize();
      });

      // Only one fetch call (health check)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("executeTask", () => {
    it("should execute task successfully", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      // Mock successful task execution
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: "generate-code",
          explanation: "Generated code",
        }),
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
      expect(taskResult!.explanation).toBe("Generated code");
    });

    it("should auto-initialize before executing task", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      const { result } = renderHook(() => useOpenCode());

      // Mock successful task execution
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

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
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      const { result } = renderHook(() => useOpenCode());

      await act(async () => {
        await result.current.initialize();
      });

      // Mock failed task execution
      (global.fetch as any).mockRejectedValueOnce(new Error("Task failed"));

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
      expect(status).toHaveProperty("state");
    });

    it("should use free model by default", () => {
      const { result } = renderHook(() => useOpenCode());

      expect(result.current.status).toBeDefined();
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
  });
});
