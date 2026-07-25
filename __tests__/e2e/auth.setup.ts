/**
 * Authenticate a test user for Playwright e2e.
 *
 * Approach:
 * 1. Calls Supabase `/auth/v1/token?grant_type=password` with the service
 *    role key in the `Authorization` header, which *bypasses* the native
 *    Supabase captcha check. This returns a valid session.
 * 2. Sets the Supabase auth cookies in the browser context from that session.
 * 3. Saves the storage state so subsequent e2e runs start authenticated.
 */
import { test as setup } from "@playwright/test"
import * as fs from "fs"
import * as path from "path"
import { config } from "dotenv"
config({ path: ".env.local" })

const authFile = ".auth/e2e-test.json"
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "e2e-test@nairi.local"
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "E2eTest!2026"

setup("authenticate", async ({ page }) => {
  page.setDefaultTimeout(120000)

  const authPath = path.resolve(authFile)
  if (fs.existsSync(authPath)) {
    const age = Date.now() - fs.statSync(authPath).mtimeMs
    if (age < 55 * 60 * 1000) {
      console.log("[auth.setup] reusing cached auth")
      return
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local")
  }

  // Use service role key to bypass Supabase native captcha on password login.
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`Auth token endpoint failed (${tokenRes.status}): ${body}`)
  }

  const session = await tokenRes.json()

  const ref = supabaseUrl.replace("https://", "").split(".")[0]
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + 3600

  await page.context().addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value: JSON.stringify({
        access_token: session.access_token,
        expires_at: expiresAt,
        refresh_token: session.refresh_token,
        token_type: "bearer",
        user: session.user,
      }),
      domain: "localhost",
      path: "/",
    },
    {
      name: `sb-${ref}-auth-refresh-token`,
      value: session.refresh_token,
      domain: "localhost",
      path: "/",
    },
  ])

  // Verify the cookies work
  await page.goto("/chat", { waitUntil: "domcontentloaded", timeout: 120000 })
  await page.waitForTimeout(2000)

  if (page.url().includes("/auth/login")) {
    throw new Error("Cookie injection did not establish a valid session")
  }

  await page.context().storageState({ path: authFile })
  console.log("[auth.setup] authenticated via service-role token endpoint")
})
