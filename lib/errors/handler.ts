/**
 * Error Handler
 * Standardized error handling and response formatting
 */
import { NextResponse } from "next/server";
import { AppErrorClass, ErrorCode, internalError } from "./types";
import { config } from "../config/env";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

export function handleError(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
  // Handle AppError instances
  if (error instanceof AppErrorClass) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
          requestId: error.requestId || requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message = config.isProduction
      ? "An internal error occurred"
      : error.message;

    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message,
          details: config.isDevelopment
            ? {
                stack: error.stack,
                name: error.name,
              }
            : undefined,
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: 500 }
  );
}

export function errorHandler(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      // Extract request ID from headers if available
      const requestId = req.headers.get("x-request-id") || undefined;
      return handleError(error, requestId);
    }
  };
}

// Log error to Sentry or other monitoring service
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (config.features.sentryEnabled && config.sentry) {
    // Sentry integration would go here
    // Sentry.captureException(error, { extra: context });
  }
  
  // Always log to console in development
  if (config.isDevelopment) {
    console.error("Error:", error);
    if (context) {
      console.error("Context:", context);
    }
  }
}
