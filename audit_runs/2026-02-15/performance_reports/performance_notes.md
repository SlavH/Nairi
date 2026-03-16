# Performance Notes (Full Audit 2026-02-15)

## Status

Lighthouse was **not run** in this audit run (optional per Full Audit Plan).

## Optional Next Steps

1. Start app: `npm run dev` (http://localhost:3000).
2. Run Lighthouse: `npx lighthouse http://localhost:3000 --output=html --output-path=./audit_runs/2026-02-15/performance_reports/home.html` (and similarly for /chat, /builder if desired).
3. Capture LCP, CLS, FCP (and overall performance score) and add a short summary to this file or to executive_summary.md.

## Previous Observations (from nairi_v34_res)

- Page load times: /, /marketplace, /dashboard, /chat, /presentations, /builder, /settings ~1–2s (acceptable).
- Generation times: Presentation ~5–8s, Image ~10–15s, Code ~10–20s.
- Loading states: Presentation, image, code builder have clear loading messages; chat shows brief skeleton.
