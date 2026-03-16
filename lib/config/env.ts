/**
 * Environment Configuration
 * Centralized environment variable access with validation and type safety
 */

type Environment = "development" | "staging" | "production";

interface EnvConfig {
  // Environment
  env: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // Stripe
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
  };
  
  // AI (BitNet only)
  ai: {
    bitnetBaseUrl?: string;
    bitnetApiKey?: string;
    replicate?: string;
  };
  
  // Database
  database?: {
    url: string;
  };
  
  // Redis
  redis?: {
    url: string;
  };
  
  // Features
  features: {
    bypassAuth: boolean;
    sentryEnabled: boolean;
  };
  
  // Sentry
  sentry?: {
    dsn: string;
    org?: string;
    project?: string;
    authToken?: string;
  };
}

function getEnv(): Environment {
  const env = process.env.NODE_ENV || "development";
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
}

function requireEnv(key: string, description?: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}${description ? ` (${description})` : ""}`
    );
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

export function getConfig(): EnvConfig {
  const env = getEnv();
  
  return {
    env,
    isDevelopment: env === "development",
    isProduction: env === "production",
    isStaging: env === "staging",
    
    supabase: {
      url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"),
      anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anonymous key"),
      serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key"),
    },
    
    stripe: {
      secretKey: requireEnv("STRIPE_SECRET_KEY", "Stripe secret key"),
      publishableKey: requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Stripe publishable key"),
      webhookSecret: optionalEnv("STRIPE_WEBHOOK_SECRET"),
    },
    
    ai: {
      // Colab-style backend (POST /chat). Override with COLAB_AI_BASE_URL; fallback BITNET_BASE_URL
      colabBaseUrl: optionalEnv("COLAB_AI_BASE_URL") || optionalEnv("BITNET_BASE_URL"),
      bitnetBaseUrl: optionalEnv("BITNET_BASE_URL"),
      bitnetApiKey: optionalEnv("BITNET_API_KEY"),
      replicate: optionalEnv("REPLICATE_API_TOKEN"),
    },
    
    database: optionalEnv("DATABASE_URL") ? {
      url: optionalEnv("DATABASE_URL")!,
    } : undefined,
    
    redis: optionalEnv("REDIS_URL") ? {
      url: optionalEnv("REDIS_URL")!,
    } : undefined,
    
    features: {
      bypassAuth: process.env.BYPASS_AUTH === "true",
      sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      org: optionalEnv("SENTRY_ORG"),
      project: optionalEnv("SENTRY_PROJECT"),
      authToken: optionalEnv("SENTRY_AUTH_TOKEN"),
    } : undefined,
  };
}

// Validate config on import (only in server-side code)
if (typeof window === "undefined") {
  try {
    getConfig();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Configuration error:", error);
    }
  }
}

export const config = getConfig();
