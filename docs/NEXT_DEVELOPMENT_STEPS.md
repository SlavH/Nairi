# Next development steps

Phases 1–200 from the plan are **completed** (migrations, validation, unit/integration/E2E tests, marketplace/learn/debate-flow-knowledge, error handling, performance, accessibility, production readiness). Below are the recommended next steps in order.

---

## 1. Documentation (Phases 151–170)

- **API docs**: Extend [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for any new or changed endpoints (marketplace recommendations, learn progress/achievements, debate vote, knowledge query, studio, create, creations, admin).
- **Architecture**: Update [ARCHITECTURE.md](ARCHITECTURE.md) if new services or flows were added (e.g. recommendation engine, progress tracker, cache).
- **Guides**: Add or update deployment, development, and troubleshooting sections; link [production.md](production.md) where relevant.
- **User-facing**: Optional: short user guides for workspace, marketplace, learn, builder.

---

## 2. Schema and library alignment

- **RecommendationEngine** (`lib/marketplace/recommendation.ts`): Uses `agents.is_published`. Either add `is_published` to the agents table (e.g. in `scripts/002_create_agents.sql`) or remove/relax that filter so recommendations work with the current schema.
- **LearningProgressTracker** (`lib/learn/progress-tracker.ts`): Align with actual DB: e.g. `lesson_progress` / `learning_analytics` and course/lesson structure. Update the lib to use existing tables/columns or add migrations and then update the lib.

---

## 3. Performance and reliability

- **Caching**: Wire [lib/cache/simple.ts](../lib/cache/simple.ts) into at least one read-heavy API (e.g. marketplace agents list) with a short TTL to reduce DB load.
- **Health**: Optionally add a readiness endpoint (e.g. `/api/health/ready`) that checks DB connectivity for orchestrators that need it.

---

## 4. Validation and stability

- Run **unit and integration tests**: `npm run test` — fix any failures.
- Run **E2E**: `npm run test:e2e` (with app running or CI) — fix flaky or failing specs.
- Manually smoke-test critical flows: auth, chat, workspace create, marketplace, learn, builder.

---

## 5. Product and ops

- **Deploy**: Use [production.md](production.md) and CI to deploy to staging/production; verify env and health checks.
- **Monitoring**: Enable error tracking (e.g. Sentry) and wire health check failures to alerts if not already.
- **Backups**: Confirm Supabase (or custom) backup/restore process and document in [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) if needed.

---

## Summary

| Priority | Area              | Action |
|----------|-------------------|--------|
| High     | Documentation     | Complete Phase 151–170 (API, architecture, guides). |
| High     | Schema/lib         | Fix RecommendationEngine and LearningProgressTracker vs DB. |
| Medium   | Performance        | Use simple cache in one read-heavy API; optional readiness endpoint. |
| Medium   | Validation         | Green test suite (`test` + `test:e2e`) and smoke-test. |
| Ongoing  | Product & ops      | Deploy, monitoring, backups. |
