/**
 * Structured Logging System (Phase 9)
 * Provides structured logging with different levels and output formats
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const parts = [
        `[${entry.timestamp}]`,
        entry.level.toUpperCase().padEnd(5),
        entry.requestId ? `[${entry.requestId}]` : "",
        entry.userId ? `[user:${entry.userId}]` : "",
        entry.message,
      ].filter(Boolean);

      let output = parts.join(" ");
      if (entry.metadata) {
        output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
      }
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      return output;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, options?: {
    requestId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    error?: Error;
  }) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
      userId: options?.userId,
      metadata: options?.metadata,
      error: options?.error ? {
        name: options.error.name,
        message: options.error.message,
        stack: this.isDevelopment ? options.error.stack : undefined,
      } : undefined,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }

    // Send to external logging service in production
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // Integration with Sentry, Datadog, etc. would go here
    // For now, just a placeholder
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry.captureException(entry.error, { extra: entry.metadata });
    }
  }

  debug(message: string, options?: Parameters<Logger["log"]>[2]) {
    this.log(LogLevel.DEBUG, message, options);
  }

  info(message: string, options?: Parameters<Logger["log"]>[2]) {
    this.log(LogLevel.INFO, message, options);
  }

  warn(message: string, options?: Parameters<Logger["log"]>[2]) {
    this.log(LogLevel.WARN, message, options);
  }

  error(message: string, options?: Parameters<Logger["log"]>[2]) {
    this.log(LogLevel.ERROR, message, options);
  }
}

export const logger = new Logger();
