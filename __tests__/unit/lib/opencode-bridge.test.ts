/**
 * OpenCode Bridge Tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { opencodeBridge, getOpenCodeBridge } from "@/lib/opencode-wasm-bridge";

describe("OpenCode Bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = getOpenCodeBridge();
      const instance2 = getOpenCodeBridge();
      expect(instance1).toBe(instance2);
    });
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          healthy: true,
          version: "1.0.0",
        }),
      });

      await opencodeBridge.initialize();
      expect(opencodeBridge.isReady()).toBe(true);
    });

    it("should initialize even if health check fails", async () => {
      // Mock failed health check
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await opencodeBridge.initialize();
      expect(opencodeBridge.isReady()).toBe(true);
    });

    it("should merge config with stored config", async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      await opencodeBridge.initialize({ model: "opencode/deepseek-v4-flash-free" });
      const config = opencodeBridge.getConfig();
      expect(config.model).toBe("opencode/deepseek-v4-flash-free");
    });
  });

  describe("executeTask", () => {
    beforeEach(async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });
      await opencodeBridge.initialize();
    });

    it("should execute task successfully", async () => {
      const mockResult = {
        success: true,
        type: "generate-code",
        explanation: "Generated a todo app",
        files: ["todo.tsx"],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await opencodeBridge.executeTask({
        id: "test-1",
        type: "generate-code",
        prompt: "Create a todo app",
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe("generate-code");
      expect(result.explanation).toBe("Generated a todo app");
    });

    it("should handle proxy errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
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
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

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
  });

  describe("callbacks", () => {
    it("should call onReady callback", async () => {
      const onReady = vi.fn();
      opencodeBridge.setCallbacks({ onReady });

      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });

      await opencodeBridge.initialize();
      expect(onReady).toHaveBeenCalled();
    });

    it("should call onComplete callback", async () => {
      const onComplete = vi.fn();
      opencodeBridge.setCallbacks({ onComplete });

      // Initialize
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });
      await opencodeBridge.initialize();

      // Execute task
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, type: "generate-code" }),
      });

      await opencodeBridge.executeTask({
        id: "test",
        type: "generate-code",
        prompt: "Test",
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("should call onError callback on failure", async () => {
      const onError = vi.fn();
      opencodeBridge.setCallbacks({ onError });

      // Initialize
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ healthy: true }),
      });
      await opencodeBridge.initialize();

      // Execute task with error
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
