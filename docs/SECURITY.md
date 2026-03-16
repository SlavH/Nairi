# Security

## Current controls

- **Proxy (request boundary):** `proxy.ts` — session (Supabase), CSRF (origin validation), request-size limits for API routes, security headers (X-Frame-Options, X-Content-Type-Options, etc.). See [ARCHITECTURE.md](ARCHITECTURE.md) “Middleware → Proxy”.
- **CSP:** `lib/security/csp.mjs` — Content-Security-Policy in `next.config.mjs`; production and dev variants. Script/style/connect/frame sources allow required third parties (Stripe, Supabase, AI providers, Sandpack).
- **Input validation:** `lib/security/request-validator.ts` — body size limits (chat, builder, upload), origin validation. Use Zod (or similar) in API routes for request bodies.
- **Auth:** Cookie-based sessions; protected routes in proxy and API route guards; `requireAuth()` / `getUserIdOrBypassForApi()` for API routes. No production secrets in repo.
- **Public API routes:** Health and other public endpoints do not expose sensitive data; rate limiting applies (see [api/RATE_LIMITS.md](api/RATE_LIMITS.md)).

## RLS (Row Level Security) audit

The app assumes RLS on user-scoped tables. Verify in migrations that every table storing user data has RLS enabled and policies that enforce `auth.uid()` (or equivalent). Admin paths should use the service role only where intended. Key tables to verify include: `profiles`, `conversations`, `messages`, `creations`, `lesson_progress`, `learning_analytics`, `user_achievements`, `user_agents`, `usage_logs`, `builder_projects`, `builder_project_collaborators`, `notifications`, `activity_logs`, `knowledge_nodes`, `knowledge_edges`, `studio_gallery`, `marketplace_reviews`, `credits_balance`, `subscriptions`, and any other tables that store per-user data. Migrations that define RLS: 001 (profiles), 004–005 (conversations, messages), 013 (creations), 008 (education/lesson_progress), 016–017 (credits, activity), 021 (builder_projects), 035 (workspace), 036 (studio), 037 (marketplace reviews), etc. Fix any missing or overly permissive policies.

## Security audit and remediation

- **Review:** Periodically review proxy, CSP, request-validator, and public API routes for missing headers, overly permissive directives, and validation gaps.
- **Automated scan:** Run an automated security scan (e.g. `npm audit`, Snyk, or OWASP ZAP) and fix critical/high findings.
- **Penetration testing:** For production, consider an external pentest; document findings and remediation in this section.
- **Hardening:** Add or tighten headers (e.g. CSP, X-DNS-Prefetch-Control) as needed; avoid relaxing CSP without justification.

## Reporting

Report security issues privately to the team; do not open public issues for vulnerabilities.
