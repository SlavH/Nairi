/**
 * Validation Middleware (Phase 7)
 * Middleware for request validation and sanitization
 */
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { sanitizeText, removeControlChars, truncate } from "./sanitize";
import { validationError } from "../errors/types";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

export function validateRequest<T>(
  schema: ZodSchema<T>,
  options?: {
    sanitize?: boolean;
    maxLength?: number;
  }
) {
  return async (req: NextRequest): Promise<{ data: T; error: NextResponse | null }> => {
    try {
      // Check content length
      const contentLength = req.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
        return {
          data: null as unknown as T,
          error: NextResponse.json(
            {
              error: {
                code: "PAYLOAD_TOO_LARGE",
                message: `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes`,
              },
            },
            { status: 413 }
          ),
        };
      }

      // Parse body
      let body;
      try {
        body = await req.json();
      } catch {
        return {
          data: null as unknown as T,
          error: NextResponse.json(
            {
              error: {
                code: "INVALID_JSON",
                message: "Invalid JSON in request body",
              },
            },
            { status: 400 }
          ),
        };
      }

      // Sanitize string fields if enabled
      if (options?.sanitize) {
        body = sanitizeObject(body, options.maxLength);
      }

      // Validate with Zod
      const data = schema.parse(body);
      return { data, error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return {
          data: null as unknown as T,
          error: NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details,
              },
            },
            { status: 400 }
          ),
        };
      }

      return {
        data: null as unknown as T,
        error: NextResponse.json(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: "Error processing request",
            },
          },
          { status: 500 }
        ),
      };
    }
  };
}

function sanitizeObject(obj: unknown, maxLength?: number): unknown {
  if (typeof obj === "string") {
    let sanitized = removeControlChars(obj);
    if (maxLength) {
      sanitized = truncate(sanitized, maxLength);
    }
    return sanitizeText(sanitized);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxLength));
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, maxLength);
    }
    return sanitized;
  }

  return obj;
}
