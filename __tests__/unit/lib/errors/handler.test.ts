/**
 * Error Handler Tests (Phase 11)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { handleError, errorHandler, logError } from "@/lib/errors/handler";
import { AppErrorClass, ErrorCode } from "@/lib/errors/types";

// Mock config
vi.mock("@/lib/config/env", () => ({
  config: {
    isProduction: false,
    isDevelopment: true,
    features: {
      sentryEnabled: false,
    },
    sentry: null,
  },
}));

describe("Error Handler", () => {
  describe("handleError", () => {
    it("should handle AppErrorClass instances", () => {
      const error = new AppErrorClass(
        ErrorCode.VALIDATION_ERROR,
        "Invalid input",
        400,
        { field: "email" }
      );

      const response = handleError(error, "req-123");

      expect(response.status).toBe(400);
      const json = response.json() as Promise<any>;
      return json.then((data) => {
        expect(data.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(data.error.message).toBe("Invalid input");
        expect(data.error.details).toEqual({ field: "email" });
        expect(data.error.requestId).toBe("req-123");
      });
    });

    it("should handle standard Error instances", () => {
      const error = new Error("Something went wrong");

      const response = handleError(error, "req-456");

      expect(response.status).toBe(500);
      const json = response.json() as Promise<any>;
      return json.then((data) => {
        expect(data.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(data.error.message).toBe("Something went wrong");
        expect(data.error.requestId).toBe("req-456");
      });
    });

    it("should handle unknown error types", () => {
      const error = { unexpected: "error" };

      const response = handleError(error);

      expect(response.status).toBe(500);
      const json = response.json() as Promise<any>;
      return json.then((data) => {
        expect(data.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(data.error.message).toBe("An unexpected error occurred");
      });
    });

    it("should include stack trace in development", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n  at test.ts:1:1";

      const response = handleError(error);
      const json = response.json() as Promise<any>;
      return json.then((data) => {
        expect(data.error.details).toHaveProperty("stack");
        expect(data.error.details.stack).toContain("Test error");
      });
    });
  });

  describe("errorHandler", () => {
    it("should wrap handler and catch errors", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler error"));
      const wrapped = errorHandler(handler);

      const request = new Request("http://localhost/api/test");
      const response = await wrapped(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error.message).toBe("Handler error");
    });

    it("should pass through successful responses", async () => {
      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const wrapped = errorHandler(handler);

      const request = new Request("http://localhost/api/test");
      const response = await wrapped(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it("should extract request ID from headers", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Error"));
      const wrapped = errorHandler(handler);

      const request = new Request("http://localhost/api/test", {
        headers: { "x-request-id": "custom-id" },
      });
      const response = await wrapped(request);

      const json = await response.json();
      expect(json.error.requestId).toBe("custom-id");
    });
  });

  describe("logError", () => {
    it("should log errors in development", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Test error");

      logError(error, { context: "test" });

      expect(consoleSpy).toHaveBeenCalledWith("Error:", error);
      expect(consoleSpy).toHaveBeenCalledWith("Context:", { context: "test" });

      consoleSpy.mockRestore();
    });
  });
});
