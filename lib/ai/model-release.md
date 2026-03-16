# Model release process

Checklist for adding a new model to Nairi:

1. **Eval** – Run offline eval (accuracy, safety, latency) on golden datasets.
2. **Rate limits** – Set per-model or per-provider rate limits in env or DB.
3. **Cost** – Add model to `lib/ai/usage-tracking.ts` COST_PER_1K if needed.
4. **Docs** – Update `lib/ai/providers.ts` and `lib/ai/model-router.ts` with new model id and features.
5. **Feature flags** – Use feature flag for gradual rollout (e.g. NAIRI_MODEL_XYZ_ENABLED).
6. **Circuit breaker** – New models use same circuit breaker in `lib/ai/circuit-breaker.ts`.

After release, monitor latency and error rate; roll back via feature flag if needed.
