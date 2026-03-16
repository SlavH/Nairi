# Rate Limiting Documentation

## Overview

Nairi implements rate limiting to ensure fair usage and system stability. Rate limits are applied per user/IP address and reset after the specified time window.

## Rate Limit Tiers

### Free Tier

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat API | 30 requests | 1 minute |
| Code Generation | 10 requests | 1 minute |
| Image Generation | 5 requests | 1 minute |
| Video Generation | 3 requests | 1 minute |
| Auth Endpoints | 5 requests | 1 minute |

### Pro Tier

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat API | 100 requests | 1 minute |
| Code Generation | 50 requests | 1 minute |
| Image Generation | 20 requests | 1 minute |
| Video Generation | 10 requests | 1 minute |
| Auth Endpoints | 20 requests | 1 minute |

### Enterprise Tier

Custom rate limits based on your needs. Contact sales@nairi.ai

## Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 2026-02-05T04:49:00Z
```

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: ISO 8601 timestamp when the limit resets

## Rate Limit Exceeded

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

The response includes a `Retry-After` header indicating seconds to wait:

```
Retry-After: 45
```

## Best Practices

### 1. Implement Exponential Backoff

```javascript
async function makeRequestWithBackoff(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url)
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      continue
    }
    
    return response
  }
  
  throw new Error('Max retries exceeded')
}
```

### 2. Monitor Rate Limit Headers

```javascript
const response = await fetch('/api/chat', options)
const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'))

if (remaining < 5) {
  console.warn('Approaching rate limit')
}
```

### 3. Batch Requests

Instead of making multiple individual requests, batch them when possible:

```javascript
// Bad: Multiple requests
for (const item of items) {
  await fetch('/api/process', { body: JSON.stringify(item) })
}

// Good: Single batched request
await fetch('/api/process/batch', { 
  body: JSON.stringify({ items }) 
})
```

### 4. Cache Responses

Cache API responses to reduce the number of requests:

```javascript
const cache = new Map()

async function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await fetch(`/api/data/${key}`).then(r => r.json())
  cache.set(key, data)
  return data
}
```

## Rate Limit Bypass

For development and testing, you can request a rate limit bypass token. Contact support@nairi.ai with:

- Your use case
- Expected request volume
- Testing timeline

## Implementation note: In-memory vs production

Rate limiting is implemented in `lib/rate-limit.ts` using an **in-memory** store (a `Map`). This is suitable for development and single-instance deployments. In production with multiple instances (e.g. serverless or horizontal scaling), limits are **not shared** across instances, so effective limits can be higher than configured.

### Production: Redis store

For production, use a shared store (e.g. Redis) so limits apply across all instances:

1. Set `REDIS_URL` in your environment (e.g. `redis://default:password@host:6379`).
2. Install optional dependency: `npm install ioredis`.
3. Use `checkRateLimitAsync(identifier, config)` from `lib/rate-limit.ts` in API routes (with `await`) so that when `REDIS_URL` is set, the Redis-backed implementation in `lib/rate-limit-redis.ts` is used; when Redis is unavailable or unset, it falls back to in-memory.
4. Migration: replace `checkRateLimit(...)` with `await checkRateLimitAsync(...)` in routes that should share limits across instances (e.g. chat, builder generate, create). See [ARCHITECTURE.md](../ARCHITECTURE.md).

Until routes use `checkRateLimitAsync` and `REDIS_URL` is set, the app uses the in-memory store only.

## Monitoring

Rate limit usage is exposed via response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) on each rate-limited API request. A **Settings > API** view at `/settings/api` shows configured limits; `GET /api/rate-limit/usage` returns the same limits for programmatic use. Current remaining/reset for a window are not stored historically; use response headers to monitor usage.

## Upgrading

If you consistently hit rate limits, consider upgrading:

- **Pro Plan**: 3-5x higher limits
- **Enterprise Plan**: Custom limits + dedicated support

Visit [nairi.ai/pricing](https://nairi.ai/pricing) to upgrade.
