# Security

## Reporting a vulnerability

If you discover a security vulnerability, please report it responsibly:

- **Email**: security@nairi.ai (or open a private security advisory on GitHub if the repo supports it).
- **Do not** open a public issue for security vulnerabilities.
- We will acknowledge and work on a fix; we may request additional details.

## Supported versions

Security updates are provided for the latest major/minor version. See [CHANGELOG.md](CHANGELOG.md) and GitHub Releases for version history.

## Security measures

- **Authentication**: Supabase Auth (JWT, cookie-based sessions). Protected routes require a valid session; `BYPASS_AUTH` is for development only and must never be enabled in production.
- **Authorization**: Role-based access control (RBAC); admin endpoints require admin role. RLS on Supabase tables restricts data to the owning user (or public where intended).
- **Audit logging**: Sensitive actions (login, billing, data export, account delete) should call [lib/audit.ts](lib/audit.ts) (or equivalent); events are stored in `audit_log`. Document events in this file or ARCHITECTURE when added.
- **Rate limiting**: In-memory or Redis-backed rate limits on chat, builder generate, create, usage, and marketplace; see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) and [lib/rate-limit](lib/rate-limit.ts). Set `REDIS_URL` in production for shared limits.
- **CSP and headers**: Content-Security-Policy, X-Frame-Options, HSTS, and other security headers are set in [next.config.mjs](next.config.mjs) via [lib/security/csp.mjs](lib/security/csp.mjs).
- **CSRF**: Origin validation for state-changing requests (proxy/request-validator).
- **Input validation**: Zod and [lib/validation/sanitize](lib/validation/sanitize.ts) for request bodies and user input; parameterized queries for DB.
- **Secrets**: Never commit `.env`; use deployment secret stores. Rotate keys via Supabase and Stripe dashboards; document rotation in [BACKUP_RECOVERY.md](docs/BACKUP_RECOVERY.md).

## Compliance

Data retention and export/delete flows are documented in [BACKUP_RECOVERY.md](docs/BACKUP_RECOVERY.md#data-retention). For GDPR or other compliance, implement “export my data” and “delete my account” and call audit logging before destructive actions.
