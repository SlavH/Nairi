/**
 * Request/Response Logging Middleware (Phase 9)
 * Logs all API requests and responses
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { randomUUID } from "crypto";

export function withLogging<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") || randomUUID();
    const startTime = Date.now();

    // Log request
    logger.info("Incoming request", {
      requestId,
      metadata: {
        method: req.method,
        url: req.url,
        pathname: new URL(req.url).pathname,
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      },
    });

    try {
      // Add request ID to headers
      req.headers.set("x-request-id", requestId);

      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      // Log response
      logger.info("Request completed", {
        requestId,
        metadata: {
          status: response.status,
          duration: `${duration}ms`,
        },
      });

      // Add request ID to response headers
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Request failed", {
        requestId,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: `${duration}ms`,
        },
      });

      throw error;
    }
  };
}
