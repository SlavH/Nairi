/**
 * OpenCode Bridge permission defaults (security contract).
 *
 * The bridge must default every tool permission to "ask" so the agent cannot
 * take destructive actions without explicit user consent. This is a separate
 * file from opencode-bridge.test.ts because the security contract is asserted
 * here independently (it must not drift silently).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const providerMock = vi.hoisted(() => {
  let status: { state: string } = { state: "idle" };
  return {
    getStatus: vi.fn(() => status),
    subscribe: vi.fn(() => () => {}),
    boot: vi.fn(async () => {
      status = { state: "ready" };
    }),
    createSession: vi.fn(async () => ({ id: "s" })),
    sendMessage: vi.fn(async () => ({
      id: "m",
      sessionID: "s",
      role: "assistant",
      parts: [{ type: "text", text: "ok" }],
    })),
    shutdown: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/webcontainer-provider", () => ({
  webContainerProvider: providerMock,
}));

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

const PERMISSION_KEYS = ["bash", "read", "edit", "write", "glob", "grep", "webfetch", "websearch"] as const;

let getOpenCodeBridge: typeof import("@/lib/opencode-wasm-bridge")["getOpenCodeBridge"];

describe("OpenCode Bridge permission security contract", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    const mod = await import("@/lib/opencode-wasm-bridge");
    getOpenCodeBridge = mod.getOpenCodeBridge;
  });

  it("defaults every permission to 'ask' (fail-safe) before initialization", () => {
    const permissions = getOpenCodeBridge().getConfig().permissions;
    for (const key of PERMISSION_KEYS) {
      expect(permissions[key], `permission "${key}" should default to "ask"`).toBe("ask");
    }
  });

  it("keeps all permissions at 'ask' after initialization", async () => {
    await getOpenCodeBridge().initialize();
    const permissions = getOpenCodeBridge().getStatus().permissions;
    for (const key of PERMISSION_KEYS) {
      expect(permissions[key]).toBe("ask");
    }
  });

  it("reports the same 'ask' defaults through getStatus", () => {
    const permissions = getOpenCodeBridge().getStatus().permissions;
    for (const key of PERMISSION_KEYS) {
      expect(permissions[key]).toBe("ask");
    }
  });

  it("does NOT silently lose other permissions when the whole permissions object is passed", async () => {
    const bridge = getOpenCodeBridge();
    await bridge.updateConfig({
      permissions: { ...bridge.getConfig().permissions, bash: "allow" },
    });
    const permissions = bridge.getConfig().permissions;
    expect(permissions.bash).toBe("allow");
    for (const key of PERMISSION_KEYS) {
      if (key === "bash") continue;
      expect(permissions[key], `permission "${key}" must stay "ask"`).toBe("ask");
    }
  });

  // Regression: a partial permissions update must MERGE with the existing
  // permissions map so the fail-safe "ask" defaults are never dropped.
  it("merges a partial permissions update, preserving other 'ask' defaults", async () => {
    const bridge = getOpenCodeBridge();
    await bridge.updateConfig({ permissions: { bash: "allow" } });
    const permissions = bridge.getConfig().permissions;
    expect(permissions.bash).toBe("allow");
    // The other keys must stay "ask", not be dropped to undefined
    for (const key of PERMISSION_KEYS) {
      if (key === "bash") continue;
      expect(permissions[key], `permission "${key}" must stay "ask"`).toBe("ask");
    }
  });

  it("defaults to 'ask' even when a stored config omits permissions", async () => {
    localStorage.setItem("opencode-config", JSON.stringify({ model: "opencode/stored-model" }));
    const bridge = getOpenCodeBridge();
    await bridge.initialize();
    const permissions = bridge.getConfig().permissions;
    for (const key of PERMISSION_KEYS) {
      expect(permissions[key]).toBe("ask");
    }
  });
});
