#!/usr/bin/env node
/**
 * Validate environment variables, especially DATABASE_URL
 * Run this before migrations or app startup
 */

import dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Load .env
const envPath = join(projectRoot, ".env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config({ path: join(process.cwd(), ".env") });

const errors = [];
const warnings = [];

// Validate DATABASE_URL
const raw =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DIRECT_URL;

const DATABASE_URL = raw ? String(raw).trim() : "";

if (!DATABASE_URL) {
  errors.push("Missing DATABASE_URL (or POSTGRES_URL / SUPABASE_DATABASE_URL / DIRECT_URL)");
  errors.push("Get it from: Supabase → Project Settings → Database → Connection string");
  errors.push("Use the Transaction pooler (port 6543) for better reliability");
} else {
  // Validate URL format
  try {
    const url = new URL(DATABASE_URL);
    
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      errors.push(`DATABASE_URL must use postgresql:// or postgres:// protocol, got: ${url.protocol}`);
    }
    
    // Check for common issues
    if (DATABASE_URL.includes("[YOUR-PASSWORD]") || DATABASE_URL.includes("YOUR-PASSWORD")) {
      errors.push("DATABASE_URL contains placeholder [YOUR-PASSWORD] - replace with actual password");
    }
    
    if (DATABASE_URL.includes("[") && DATABASE_URL.includes("]")) {
      warnings.push("DATABASE_URL contains brackets [] - make sure password is properly URL-encoded");
    }
    
    // Check port
    const port = url.port ? parseInt(url.port, 10) : 5432;
    if (port === 5432) {
      warnings.push("Using Direct connection (port 5432) - consider using Transaction pooler (port 6543) for better reliability");
    } else if (port === 6543) {
      console.log("✓ Using Transaction pooler (port 6543) - good choice!");
    }
    
    // Check for special characters in password that might need encoding
    const password = url.password || "";
    if (password && /[@#$%^&*()+=\[\]{}|\\:;"'<>?,./`~!]/.test(password)) {
      warnings.push("Password contains special characters - ensure they are URL-encoded (e.g., @ → %40)");
    }
    
    // Validate hostname
    if (!url.hostname || url.hostname.includes("example") || url.hostname.includes("localhost")) {
      warnings.push("DATABASE_URL hostname looks suspicious - verify it's correct");
    }
    
  } catch (err) {
    errors.push(`DATABASE_URL is not a valid URL: ${err.message}`);
    errors.push(`Value: ${DATABASE_URL.substring(0, 50)}...`);
  }
}

// Validate Supabase variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  warnings.push("Missing NEXT_PUBLIC_SUPABASE_URL (required for Supabase client)");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  warnings.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (required for Supabase client)");
}

// Validate Stripe (optional but recommended)
if (!process.env.STRIPE_SECRET_KEY && !process.env.BYPASS_AUTH) {
  warnings.push("Missing STRIPE_SECRET_KEY (required for payments)");
}

// Colab AI URL (required for all AI features)
if (!process.env.BITNET_BASE_URL?.trim()) {
  warnings.push("BITNET_BASE_URL not set - all AI (chat, builder, etc.) goes to Colab; set it to your tunnel URL");
  warnings.push("Set BITNET_BASE_URL in .env (e.g. https://xxxxx.trycloudflare.com/v1)");
}

// Print results
console.log("Environment Variable Validation\n" + "=".repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log("✓ All checks passed!");
  process.exit(0);
}

if (errors.length > 0) {
  console.error("\n❌ Errors (must fix):");
  errors.forEach(err => console.error(`  • ${err}`));
}

if (warnings.length > 0) {
  console.warn("\n⚠️  Warnings:");
  warnings.forEach(warn => console.warn(`  • ${warn}`));
}

console.log("\n" + "=".repeat(50));

if (errors.length > 0) {
  console.error("\nFix errors above before running migrations or starting the app.");
  process.exit(1);
}

console.log("\nWarnings can be ignored if intentional, but may cause issues.");
process.exit(0);
