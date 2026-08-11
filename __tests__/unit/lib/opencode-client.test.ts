/**
 * OpenCode Client Tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { OpenCodeClient, getOpenCodeClient, createOpenCodeClient } from "@/lib/opencode-client";

describe("OpenCodeClient", () => {
  let client: OpenCodeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    client = createOpenCodeClient("http://localhost:4096", 5000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create client with default values", () => {
      const defaultClient = new OpenCodeClient();
      expect(defaultClient).toBeDefined();
    });

    it("should create client with custom values", () => {
      const customClient = new OpenCodeClient("http://custom:8080", 10000);
      expect(customClient).toBeDefined();
    });
  });

  describe("singleton", () => {
    it("should return same instance", () => {
      const instance1 = getOpenCodeClient();
      const instance2 = getOpenCodeClient();
      expect(instance1).toBe(instance2);
    });
  });

  describe("health", () => {
    it("should return health status", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ healthy: true, version: "1.0.0" }),
      });

      const health = await client.health();
      expect(health.healthy).toBe(true);
      expect(health.version).toBe("1.0.0");
    });

    it("should handle errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await expect(client.health()).rejects.toThrow("Network error");
    });
  });

  describe("sessions", () => {
    it("should create session", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          id: "session-1",
          title: "Test Session",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const session = await client.createSession({ model: "opencode/big-pickle" });
      expect(session.id).toBe("session-1");
      expect(session.title).toBe("Test Session");
    });

    it("should list sessions", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { id: "session-1", title: "Session 1" },
          { id: "session-2", title: "Session 2" },
        ],
      });

      const sessions = await client.listSessions();
      expect(sessions).toHaveLength(2);
    });

    it("should get session by id", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "session-1", title: "Test Session" }),
      });

      const session = await client.getSession("session-1");
      expect(session.id).toBe("session-1");
    });

    it("should delete session", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      await expect(client.deleteSession("session-1")).resolves.not.toThrow();
    });
  });

  describe("messaging", () => {
    it("should send message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          id: "msg-1",
          sessionID: "session-1",
          role: "assistant",
          parts: [{ type: "text", text: "Hello!" }],
          createdAt: new Date().toISOString(),
        }),
      });

      const message = await client.sendMessage("session-1", [
        { type: "text", text: "Hi" },
      ]);
      expect(message.id).toBe("msg-1");
      expect(message.parts).toHaveLength(1);
    });

    it("should get messages", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { id: "msg-1", role: "user" },
          { id: "msg-2", role: "assistant" },
        ],
      });

      const messages = await client.getMessages("session-1");
      expect(messages).toHaveLength(2);
    });

    it("should abort session", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      await expect(client.abortSession("session-1")).resolves.not.toThrow();
    });
  });

  describe("files", () => {
    it("should list files", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { name: "src", type: "directory", path: "/src" },
          { name: "index.ts", type: "file", path: "/index.ts" },
        ],
      });

      const files = await client.listFiles();
      expect(files).toHaveLength(2);
    });

    it("should read file", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "console.log('hello')",
          path: "/index.ts",
        }),
      });

      const file = await client.readFile("/index.ts");
      expect(file.content).toBe("console.log('hello')");
    });

    it("should search files", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ["/src/app.ts", "/src/utils.ts"],
      });

      const results = await client.searchFiles("app");
      expect(results).toHaveLength(2);
    });
  });

  describe("VCS", () => {
    it("should get VCS info", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          branch: "main",
          remote: "origin",
          commit: "abc123",
        }),
      });

      const info = await client.getVcsInfo();
      expect(info.branch).toBe("main");
    });

    it("should get VCS status", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { path: "/src/app.ts", status: "modified" },
          { path: "/src/new.ts", status: "added" },
        ],
      });

      const status = await client.getVcsStatus();
      expect(status).toHaveLength(2);
    });
  });

  describe("MCP", () => {
    it("should list MCP servers", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { name: "server1", status: "connected", tools: ["tool1"] },
        ],
      });

      const servers = await client.listMcpServers();
      expect(servers).toHaveLength(1);
    });

    it("should add MCP server", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          name: "new-server",
          status: "connected",
          tools: [],
        }),
      });

      const server = await client.addMcpServer("new-server", {
        command: "npx",
        args: ["@modelcontextprotocol/server-filesystem"],
      });
      expect(server.name).toBe("new-server");
    });
  });

  describe("agents and skills", () => {
    it("should list agents", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { id: "agent1", name: "Code Agent", mode: "primary" },
        ],
      });

      const agents = await client.listAgents();
      expect(agents).toHaveLength(1);
    });

    it("should list skills", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { name: "react", description: "React development", files: ["*.tsx"] },
        ],
      });

      const skills = await client.listSkills();
      expect(skills).toHaveLength(1);
    });
  });

  describe("PTY", () => {
    it("should list shells", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => [
          { name: "bash", path: "/bin/bash" },
          { name: "zsh", path: "/bin/zsh" },
        ],
      });

      const shells = await client.listShells();
      expect(shells).toHaveLength(2);
    });

    it("should create PTY", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          id: "pty-1",
          shell: "bash",
          createdAt: new Date().toISOString(),
        }),
      });

      const pty = await client.createPty("bash");
      expect(pty.id).toBe("pty-1");
    });
  });

  describe("config", () => {
    it("should get config", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          model: "opencode/big-pickle",
          permission: { bash: "allow" },
        }),
      });

      const config = await client.getConfig();
      expect(config.model).toBe("opencode/big-pickle");
    });

    it("should update config", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          model: "opencode/mimo-v2.5-free",
        }),
      });

      const config = await client.updateConfig({ model: "opencode/mimo-v2.5-free" });
      expect(config.model).toBe("opencode/mimo-v2.5-free");
    });
  });

  describe("event URLs", () => {
    it("should return global event URL", () => {
      const url = client.getEventSourceUrl();
      expect(url).toBe("http://localhost:4096/event");
    });

    it("should return session event URL", () => {
      const url = client.getEventSourceUrl("session-1");
      expect(url).toBe("http://localhost:4096/session/session-1/events");
    });

    it("should return global event URL from method", () => {
      const url = client.getGlobalEventSourceUrl();
      expect(url).toBe("http://localhost:4096/global/event");
    });
  });
});
