# Nairi v34 - Missing Features & Gaps (Re-Audit 2026-02-15)

## Overview

Post-remediation. Previous critical and major gaps (chat input, Explore Marketplace, security section, mobile layout, quick action labels, Docs link) have been addressed.

---

## Addressed in Remediation

- Chat text input: was broken; now fixed (ref sync, no guard).
- Explore Marketplace button: was non-functional; now direct Link with data-testid.
- Landing security section: was empty boxes; now fallback content and optional chaining.
- Mobile responsive layout: sidebars collapsible; main/header padding on mobile.
- Quick action labels: were truncated; now wrap + tooltip + touch target.
- Docs navigation: data-testid and E2E added; Link unchanged.

---

## Remaining Gaps (Non-Blocking)

### E2E Not Run in This Audit

- Playwright browsers were not installed in the audit environment. Run `npx playwright install` then `npm run test:e2e` to verify stability and core flows.
- health-api.spec.ts expects `/api/v1/health`; app may expose `/api/health`. Align if needed.

### UI-Only / Unverified

- Video Generation: UI present; generation not tested.
- Canvas Editor: UI present; drawing not tested.
- Voice Mode: UI present; voice not tested.
- Code Agent: UI present; coding not tested.
- Workflows: UI present; execution not tested.

### Optional Follow-Ups

- Lighthouse on /, /chat, /builder (LCP, CLS, FCP).
- axe-core or manual a11y (TESTING.md section 6).
- Cross-browser smoke (Safari, Firefox, Edge).
- Real mobile device test (not only emulation).

---

## Recommendations

1. Run E2E after `npx playwright install`; fix any failures and document.
2. Align health API route or E2E spec.
3. Optionally run Lighthouse and a11y; document results in performance_reports/ and minor_issues/ or a11y_issues/.
