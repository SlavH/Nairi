/**
 * Standardized Error Types
 * Defines error codes and types for consistent error handling across the application
 */

export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  
  // Authentication Errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  
  // Authorization Errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  RESOURCE_ACCESS_DENIED = "RESOURCE_ACCESS_DENIED",
  
  // Not Found Errors (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  
  // Conflict Errors (409)
  CONFLICT = "CONFLICT",
  RESOURCE_EXISTS = "RESOURCE_EXISTS",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  
  // Server Errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Service Unavailable (503)
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
  
  // Payment Errors
  PAYMENT_ERROR = "PAYMENT_ERROR",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

export class AppErrorClass extends Error implements AppError {
  code: ErrorCode;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
  requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }
}

// Error factory functions
export function createError(
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>,
  requestId?: string
): AppErrorClass {
  return new AppErrorClass(code, message, statusCode, details, requestId);
}

export function validationError(message: string, details?: Record<string, unknown>, requestId?: string) {
  return createError(ErrorCode.VALIDATION_ERROR, message, 400, details, requestId);
}

export function unauthorizedError(message = "Unauthorized", requestId?: string) {
  return createError(ErrorCode.UNAUTHORIZED, message, 401, undefined, requestId);
}

export function forbiddenError(message = "Forbidden", details?: Record<string, unknown>, requestId?: string) {
  return createError(ErrorCode.FORBIDDEN, message, 403, details, requestId);
}

export function notFoundError(message = "Resource not found", requestId?: string) {
  return createError(ErrorCode.NOT_FOUND, message, 404, undefined, requestId);
}

export function rateLimitError(message = "Rate limit exceeded", details?: Record<string, unknown>, requestId?: string) {
  return createError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details, requestId);
}

export function internalError(message = "Internal server error", details?: Record<string, unknown>, requestId?: string) {
  return createError(ErrorCode.INTERNAL_ERROR, message, 500, details, requestId);
}

export function serviceUnavailableError(message = "Service unavailable", requestId?: string) {
  return createError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, undefined, requestId);
}
