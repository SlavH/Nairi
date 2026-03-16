# Nairi v34 - API Documentation

**Version**: 0.34.0  
**Last Updated**: February 13, 2026  
**Base URL**: `http://localhost:3000/api` (development)  
**Production URL**: TBD

**Maintenance:** Keep this document in sync with code: list all public routes, request/response shapes, auth requirements, and rate limits. Update when adding or changing API routes.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [Chat API](#chat-api)
4. [User Management](#user-management)
5. [Marketplace](#marketplace)
6. [Learn](#learn)
7. [Debate](#debate)
8. [Knowledge](#knowledge)
9. [Studio](#studio)
10. [Create (Workspace)](#create-workspace)
11. [Creations](#creations)
12. [Admin](#admin)
13. [Presentations](#presentations)
14. [Builder](#builder)
15. [Flow](#flow)
16. [Credits](#credits)
17. [Workspace](#workspace)
18. [Additional API routes](#additional-api-routes)
19. [Error Handling](#error-handling)
20. [Rate Limiting](#rate-limiting)
21. [Versioning](#versioning)

---

## Authentication

Most API endpoints require authentication using **Supabase Auth**. The app uses **cookie-based sessions** (session cookies set by Supabase after login). API routes use `createClient()` from `@/lib/supabase/server` and `supabase.auth.getUser()` to read the current user from the request cookies. In development, `BYPASS_AUTH=true` allows protected routes to run with a bypass user id without logging in.

### Cookie-based (browser / same-origin)

No extra headers: the Supabase client reads the session from cookies. Use this when calling APIs from the same app (e.g. fetch from the frontend).

### Bearer token (mobile / external clients)

For non-browser clients (e.g. mobile apps, external services), send the Supabase access token:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Use `requireAuth()` from `@/lib/api-middleware` in API routes that accept Bearer tokens; it validates the JWT with Supabase and returns the user id (or 401). When `BYPASS_AUTH=true`, missing/invalid token still returns success with a bypass user id.

### Getting an access token (for Bearer usage)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token
```

---

## Health & Status

### GET /api/health

Returns the health status of the application.

**Authentication**: Not required

**Response**: 200 OK

```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T15:45:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "server": "ok"
  }
}
```

**Error Response**: 503 Service Unavailable

```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-05T15:45:00.000Z",
  "error": "Database connection failed"
}
```

---

### HEAD /api/health

Readiness check for load balancers and orchestration.

**Authentication**: Not required

**Response**: 200 OK (no body)

---

### GET /api/health/readiness

Readiness probe that verifies critical dependencies (e.g. database). Use for Kubernetes readiness probes or load balancers that need DB-dependent readiness.

**Authentication**: Not required

**Response**: 200 OK

```json
{
  "status": "ready"
}
```

**Error Response**: 503 Service Unavailable

```json
{
  "status": "not_ready",
  "reason": "database_unavailable"
}
```

---

### GET /api/v1/health

Versioned health check endpoint.

**Authentication**: Not required

**Response**: 200 OK

```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "2026-02-05T15:45:00.000Z",
  "message": "API v1 is operational"
}
```

---

## Chat API

### POST /api/chat

Send a message to the AI and receive a streaming response.

**Authentication**: Required

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "model": "gpt-4",
  "provider": "openai",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messages | Array | Yes | Array of message objects with role and content |
| model | String | Yes | AI model to use (e.g., "gpt-4", "claude-3-opus") |
| provider | String | Yes | AI provider ("openai", "anthropic", "google", etc.) |
| temperature | Number | No | Sampling temperature (0-2, default: 0.7) |
| maxTokens | Number | No | Maximum tokens to generate (default: 2000) |

**Response**: 200 OK (Streaming)

The response is a Server-Sent Events (SSE) stream:

```
data: {"type":"text","content":"Hello"}
data: {"type":"text","content":" there"}
data: {"type":"text","content":"!"}
data: {"type":"done"}
```

**Error Responses**:

- 400 Bad Request - Invalid request body
- 401 Unauthorized - Missing or invalid authentication
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - AI provider error

---

### GET /api/chat/history

List conversations for the authenticated user.

**Authentication**: Required (cookie or Bearer; BYPASS_AUTH in dev)

**Response**: 200 OK

```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "New Conversation",
      "agent_id": null,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-02-05T15:45:00.000Z"
    }
  ]
}
```

**Error responses**: 401 Unauthorized, 500 Internal Server Error

**Rate limits**: Same as general API; no dedicated limit. For heavy usage see [RATE_LIMITS](api/RATE_LIMITS.md).

---

### GET /api/chat/conversations/[conversationId]

Get messages for a conversation. User can only access their own conversations.

**Authentication**: Required (cookie or Bearer; BYPASS_AUTH in dev)

**Response**: 200 OK

```json
{
  "conversationId": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello",
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi there!",
      "created_at": "2026-01-01T00:00:01.000Z"
    }
  ]
}
```

**Error responses**: 400 Missing conversationId, 401 Unauthorized, 403 Forbidden, 404 Conversation not found, 500 Internal Server Error

**Rate limits**: Same as general API; no dedicated limit.

---

## User Management

### GET /api/profile

Get the authenticated user's profile (from `profiles` table).

**Authentication**: Required

**Response**: 200 OK

```json
{
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "email": "user@example.com",
    "bio": null,
    "website": null,
    "company": null,
    "location": null,
    "preferred_language": null,
    "timezone": null,
    "notification_preferences": null,
    "ai_preferences": null,
    "interests": null,
    "onboarding_completed": false,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-02-05T15:45:00.000Z"
  }
}
```

---

### PATCH /api/profile

Update the authenticated user's profile. Only allowed fields are accepted.

**Authentication**: Required

**Request Body** (all fields optional): `full_name`, `avatar_url`, `bio`, `website`, `company`, `location`, `preferred_language`, `timezone`, `notification_preferences`, `ai_preferences`, `interests`, `onboarding_completed`

**Response**: 200 OK

```json
{
  "success": true,
  "profile": { ... }
}
```

---

### GET /api/usage

Get usage statistics for the authenticated user (current month; from `usage_logs`).

**Authentication**: Required

**Response**: 200 OK

```json
{
  "monthlyCost": 1.25,
  "totalLogs": 42,
  "byType": {
    "text": 0.5,
    "presentation": 0.45,
    "image": 0.3
  }
}
```

---

## Marketplace

### GET /api/marketplace/agents

List marketplace agents for external/mobile clients.

**Authentication**: Optional (when authenticated, each agent includes an `owned` flag)

**Query parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (e.g. "Research", "Development"); use "all" or omit for all |
| sort | string | `popular` (default), `newest`, `price_asc`, `price_desc`, `rating` |
| q | string | Search in name and description |
| limit | number | Max results (default 50, max 100) |
| offset | number | Pagination offset (default 0) |

**Response**: 200 OK

```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Research Assistant",
      "description": "...",
      "category": "Research",
      "price_cents": 0,
      "icon": "search",
      "capabilities": ["Web Search", "..."],
      "is_featured": true,
      "is_free": true,
      "usage_count": 42,
      "rating": 4.5,
      "image_url": null,
      "created_at": "...",
      "updated_at": "...",
      "owned": true
    }
  ],
  "total": 1
}
```

**Error responses**: 500 Internal Server Error

**Caching**: Response may be served from in-memory cache (short TTL) for anonymous or repeated requests to reduce DB load.

---

### GET /api/marketplace/recommendations

Get personalized agent recommendations for the authenticated user (based on usage patterns, trending agents, category match).

**Authentication**: Required

**Query parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max recommendations (default 10, max 50) |

**Response**: 200 OK

```json
{
  "recommendations": [
    {
      "agentId": "uuid",
      "score": 45,
      "reason": "Trending, Highly rated, Matches your interests"
    }
  ]
}
```

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### GET /api/marketplace/agents/[agentId]

Get a single marketplace agent by ID.

**Authentication**: Optional (when authenticated, response includes `owned`)

**Response**: 200 OK — full agent object plus `owned: boolean` when authenticated.

**Error responses**: 400 Missing agentId, 404 Agent not found, 500 Internal Server Error

---

### POST /api/marketplace/agents/[agentId]/install

Install (purchase) an agent for the current user. Equivalent to POST /api/marketplace/purchase with body `{ agentId }`.

**Authentication**: Required

**Request Body** (optional): `{ "useCredits": true }` to pay with credits when applicable.

**Response**: 200 OK (free agent or credit purchase)

```json
{
  "success": true,
  "message": "Agent added successfully",
  "agent": { ... }
}
```

For paid agents (Stripe), returns `{ success: true, checkoutUrl: "...", sessionId: "..." }`; redirect the client to `checkoutUrl` to complete payment.

**Error responses**: 400 Agent already owned / Invalid request, 401 Unauthorized, 404 Agent not found, 500 Internal Server Error

---

### POST /api/marketplace/purchase

Purchase (or install) an agent for the authenticated user. Free agents are added directly; paid agents use Stripe checkout or credits.

**Authentication**: Required

**Request Body**:

```json
{
  "agentId": "uuid-of-agent",
  "useCredits": false
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentId | String (UUID) | Yes | ID of the agent to purchase |
| useCredits | Boolean | No | If true, deduct from user credits when applicable |

**Response**: 200 OK (free agent or credit purchase)

```json
{
  "success": true,
  "message": "Agent added successfully",
  "agent": { ... }
}
```

For paid agents (Stripe), the API returns `checkoutUrl` and `sessionId`; redirect the client to `checkoutUrl` to complete payment. For list/detail/install via path, use [GET /api/marketplace/agents](#get-apimarketplaceagents), [GET /api/marketplace/agents/[agentId]](#get-apimarketplaceagentsagentid), and [POST /api/marketplace/agents/[agentId]/install](#post-apimarketplaceagentsagentidinstall).

---

## Learn

Learning progress and achievements (Nairi Learn). Requires education tables (008) and learn progress tracking (038).

### GET /api/learn/progress

Get the authenticated user's learning progress across all courses (completed lessons, total lessons, progress percent, time spent).

**Authentication**: Required

**Response**: 200 OK

```json
{
  "progress": [
    {
      "courseId": "uuid",
      "courseTitle": "Introduction to AI",
      "completedLessons": 5,
      "totalLessons": 10,
      "progressPercent": 50,
      "timeSpent": 120,
      "lastAccessed": "2026-02-13T12:00:00.000Z"
    }
  ]
}
```

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### GET /api/learn/achievements

List achievements unlocked by the authenticated user.

**Authentication**: Required

**Response**: 200 OK — array of achievement objects (from `achievements` table joined with `user_achievements`).

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/learn/achievements

Check and unlock achievements for the current user (e.g. after completing a lesson or course).

**Authentication**: Required

**Response**: 200 OK

```json
{
  "success": true,
  "newlyUnlocked": [ { "id": "uuid", "name": "...", "description": "..." } ]
}
```

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

## Debate

### GET /api/debate/[sessionId]/vote

Get vote counts by position for a debate session (no auth required for read).

**Authentication**: Not required

**Response**: 200 OK

```json
{
  "voteCounts": { "for": 10, "against": 5 }
}
```

---

### POST /api/debate/[sessionId]/vote

Submit or update the authenticated user's vote for a debate session.

**Authentication**: Required

**Request Body**:

```json
{
  "position": "for"
}
```

**Response**: 200 OK

```json
{
  "success": true,
  "vote": { "session_id": "...", "user_id": "...", "position": "for" },
  "voteCounts": { "for": 11, "against": 5 }
}
```

**Error responses**: 401 Unauthorized, 400 Debate session not found / Invalid request, 500 Internal Server Error

---

## Knowledge

### POST /api/knowledge/query

Query the user's knowledge graph (nodes and edges). Searches `knowledge_nodes` by title/content and `knowledge_edges` by `edge_type`; stores the query in `knowledge_queries`.

**Authentication**: Required

**Request Body**:

```json
{
  "query": "search term"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search text (1–500 chars) |

**Response**: 200 OK

```json
{
  "success": true,
  "results": {
    "nodes": [ { "id": "...", "title": "...", "content": "...", "user_id": "..." } ],
    "edges": [ { "id": "...", "edge_type": "...", "user_id": "..." } ]
  }
}
```

**Error responses**: 401 Unauthorized, 400 Invalid request, 500 Internal Server Error

---

## Studio

Studio provides media gallery and generation endpoints.

### GET /api/studio/gallery

List the authenticated user's studio gallery items. Optional query: `type` (image | video | audio), `tags` (comma-separated).

**Authentication**: Required

**Response**: 200 OK — array of gallery items (mediaType, title, description, fileUrl, thumbnailUrl, metadata, tags, isPublic, created_at).

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/studio/gallery

Create a gallery item (mediaType, title, description, fileUrl, thumbnailUrl optional, metadata, tags, isPublic).

**Authentication**: Required

**Request Body**: `mediaType` (image | video | audio), `fileUrl` (required), optional `title`, `description`, `thumbnailUrl`, `metadata`, `tags`, `isPublic` (default false).

**Response**: 201 Created — created gallery item.

**Error responses**: 401 Unauthorized, 400 Validation error, 500 Internal Server Error

---

## Create (Workspace)

### POST /api/create

Create AI-generated content by type (presentation, website, document, visual, code, analysis). Uses design brief and Groq fallback generation. Returns generated content; when authenticated, can persist as creation.

**Authentication**: Required (or bypass in development)

**Request Body**:

```json
{
  "type": "presentation",
  "prompt": "Product launch deck for SaaS",
  "options": { "style": "professional", "format": "short", "audience": "executives" }
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | presentation, website, document, visual, code, analysis |
| prompt | string | Yes | Description of what to create |
| options | object | No | style, format (short | medium | long), audience |

**Response**: 200 OK — generated content (structure depends on type).

**Error responses**: 401 Unauthorized, 400 Invalid type/prompt, 429 Rate limit, 500 Internal Server Error

---

## Creations

Creations CRUD uses the `creations` table (script 013). RLS: users can view own or public creations; create/update/delete own only.

### GET /api/creations

List creations for the authenticated user.

**Authentication**: Required

**Query parameters**: `type` (filter by type), `limit` (default 50, max 100), `offset` (default 0)

**Response**: 200 OK — `{ creations: [...], total: number }`. Each item: id, type, prompt, content, options, metadata, is_public, is_featured, likes_count, views_count, created_at, updated_at.

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/creations

Create a creation.

**Authentication**: Required

**Request Body**: `{ type: string, prompt: string, content: string, options?: object, metadata?: object, is_public?: boolean }`

**Response**: 201 Created — created creation object.

**Error responses**: 401 Unauthorized, 400 Validation error, 500 Internal Server Error

---

### GET /api/creations/[id]

Get a creation by ID (own or public). **PATCH** to update (prompt, content, options, metadata, is_public). **DELETE** to remove (own only).

**Authentication**: Required

**Error responses**: 400 Missing id, 401 Unauthorized, 404 Not found, 500 Internal Server Error

---

### GET /api/creations/stats

Get creation counts by type and recent activity for the authenticated user.

**Authentication**: Required

**Response**: 200 OK — `{ total: number, byType: Record<string, number>, recent: Array<{ id, type, created_at }> }`

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

## Admin

Admin endpoints require the user to have admin role (RBAC).

### GET /api/admin/users

List users with pagination (for admin dashboard). Returns profiles with roles.

**Authentication**: Required (admin)

**Query parameters**: `page` (default 1), `limit` (default 50)

**Response**: 200 OK — array of users with `id`, `email`, `full_name`, `subscription_tier`, `created_at`, `roles`.

**Error responses**: 401 Unauthorized, 403 Admin access required, 500 Internal Server Error

---

### POST /api/admin/users/[userId]/roles

Assign or remove a role for a user. Body: `{ role: "user" | "pro" | "admin" | "enterprise", action: "assign" | "remove" }`.

**Authentication**: Required (admin)

**Error responses**: 401 Unauthorized, 403 Forbidden, 404 Not found, 400 Validation error, 500 Internal Server Error

---

## Presentations

Presentations are persisted as creations with `type: 'presentation'`. Use the CRUD endpoints below to list, get, update, and delete; use POST /api/generate-presentation to generate slides (which also saves a creation when authenticated).

### GET /api/presentations

List presentations for the authenticated user.

**Authentication**: Required

**Response**: 200 OK

```json
{
  "presentations": [
    {
      "id": "uuid",
      "prompt": "Topic or title",
      "content": "...",
      "options": { "slideCount": 8, "style": "professional", "theme": "dark" },
      "metadata": { "slideCount": 8, "style": "professional" },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### GET /api/presentations/[id]

Get a single presentation by ID. User can only access their own.

**Authentication**: Required

**Response**: 200 OK — same shape as one item in the list above.

**Error responses**: 400 Missing id, 401 Unauthorized, 404 Presentation not found, 500 Internal Server Error

---

### PATCH /api/presentations/[id]

Update a presentation. Only allowed fields are accepted: `prompt`, `content`, `options`, `metadata`.

**Authentication**: Required

**Request Body** (all optional): `{ "prompt": "...", "content": "...", "options": {}, "metadata": {} }`

**Response**: 200 OK — updated presentation object.

**Error responses**: 400 Missing id, 401 Unauthorized, 404 Presentation not found, 500 Internal Server Error

---

### DELETE /api/presentations/[id]

Delete a presentation.

**Authentication**: Required

**Response**: 204 No Content

**Error responses**: 400 Missing id, 401 Unauthorized, 500 Internal Server Error

---

### POST /api/presentations

Create a presentation (e.g. empty or with client-provided content). For AI-generated slides, use POST /api/generate-presentation instead.

**Authentication**: Required

**Request Body** (optional): `{ "prompt": "...", "content": "...", "options": {}, "metadata": {} }`

**Response**: 201 Created — created presentation object.

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/generate-presentation

Generate presentation slides from a topic prompt. Returns a JSON array of slides; does not save to the database.

**Authentication**: Required (or bypass in development)

**Request Body**:

```json
{
  "prompt": "Introduction to Machine Learning for business executives",
  "slideCount": 8,
  "style": "professional",
  "theme": "dark",
  "includeImages": true,
  "format": "json"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | String | Yes | Topic or title (max 5000 characters) |
| slideCount | Number | No | Number of slides (3–20, default 8) |
| style | String | No | professional, creative, minimal, corporate, educational |
| theme | String | No | light, dark, gradient |
| includeImages | Boolean | No | Default true |
| format | String | No | html or json (default json) |

**Response**: 200 OK

```json
{
  "success": true,
  "slides": [
    {
      "id": 1,
      "title": "Introduction",
      "content": ["Point 1", "Point 2"],
      "notes": "Speaker notes...",
      "layout": "title",
      "imagePrompt": "Optional image description"
    }
  ]
}
```

**Error Responses**: 400 (prompt missing or too long), 401 (unauthorized), 429 (rate limit). When authenticated, the generated presentation is also saved as a creation (type `presentation`); use [GET /api/presentations](#get-apipresentations) to list and [GET /api/presentations/[id]](#get-apipresentationsid) to fetch by id.

---

## Builder

The Builder provides AI-powered website/code generation. The main page is at `/builder` (or `/builder-v2`, which redirects to `/builder`).

### POST /api/builder/generate

Generate or update project code from a natural-language prompt. Returns a streaming response with plan updates, task updates, file updates, and message chunks.

**Authentication**: Required (or bypass in development)

**Request Body**:

```json
{
  "prompt": "Build a landing page for a SaaS product with hero, features, and pricing",
  "currentFiles": [
    {
      "id": "1",
      "name": "page.tsx",
      "path": "/app/page.tsx",
      "content": "...",
      "language": "typescript",
      "isModified": false
    }
  ],
  "conversationHistory": []
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | String | Yes | Natural-language description of what to build or change |
| currentFiles | Array | No | Current project files (path, content, language) |
| conversationHistory | Array | No | Previous chat messages for context |

**Response**: 200 OK (Streaming, NDJSON)

Each line is a JSON object. **Stream types:** `plan` (tasks array), `task-update` (taskId, status), `file-update` (file object), `message` (content chunk), `complete`. On failure, the stream sends `error` (e.g. `{"type":"error","content":"..."}`) before closing so the client can set plan status to failed and show the message. Request body is validated with Zod (`lib/builder-v2/schemas/request-schema.ts`); invalid or missing fields return 400 with a clear message.

**Error Responses**: 400 (invalid or missing prompt/body; see request schema), 401 (unauthorized), 413 (payload too large; see middleware builder limit), 429 (rate limit — client should show e.g. "Too many requests; try again in a minute"), 500 (generation error).

**Builder usage**: Auth (or BYPASS_AUTH in development) is required. Rate limit: 10 requests per minute per client (BUILDER_RATE_LIMIT). Typical flow: client sends POST with prompt and current state → stream returns plan, then task-update and file-update events, then message chunks, then `complete`; on failure the stream may send `error` before closing.

**System prompt sources**: The builder system prompt (`V0_SYSTEM_PROMPT` in `lib/builder-v2/prompts/system-prompt.ts`; see Builder system prompt subsection below) incorporates rules derived from Claude Sonnet artifacts prompts (GitHub gists), Anthropic’s “Prompting for frontend aesthetics” cookbook, Claude Code “Doing tasks” and “Tone and style” prompts (Piebald-AI/claude-code-system-prompts), and forensic analysis of Claude 3.5 Sonnet (artifacts, complete code, consistent style). These are applied to improve code completeness, Tailwind usage, anti–AI-slop aesthetics, and task discipline.

**Generation behavior**: The builder uses prompt analysis (`lib/builder-v2/utils/prompt-analysis.ts`) and design guidance (`lib/builder-v2/utils/design-intelligence.ts`) to tailor the model context. Response parsing supports multiple shapes (JSON block, code blocks, brace-balanced JSON, greedy JSON, single-file fallback) and truncated-JSON repair. Validation and auto-fix run on generated code; after max attempts the main page may be replaced with a safe starter. Optional retries (when enabled via env) can run once on validation failure and once for a missing "wow" element (gradient text, animation, hover:scale, glassmorphism). Env flags: `BUILDER_RETRY_ON_VALIDATION_FAILURE=true` to allow one retry when validation fails after auto-fix; `BUILDER_RETRY_FOR_WOW=true` to allow one retry when the page lacks a wow element.

#### Builder system prompt

The builder system prompt lives in **`lib/builder-v2/prompts/system-prompt.ts`**. The route imports `V0_SYSTEM_PROMPT` from that module; it is not defined inline in the route.

- **Purpose**: Define role, output format (JSON only; plan/files/message), preview constraints (no document tags, nav/main/section required), design quality (images, animations, real copy), and behavior (interpreting requests, Bolt-style rules, task discipline).
- **Structure**: The prompt is composed in four tiers—(1) critical: output format and preview constraints; (2) behavior: role, goal, interpreting requests, Bolt rules; (3) design: design quality and website-type reference; (4) reference: multi-page, component patterns, common failures, quality checklist. Layout patterns and website types are **not** listed in the system prompt; they are defined in `lib/builder-v2/utils/design-intelligence.ts` and injected into the **user message** as DESIGN GUIDANCE (e.g. via `getDesignGuidance(websiteType, colorScheme)`). Output format and forbidden patterns (no `<html>`/`<body>`, no single-div, etc.) are in the system prompt.
- **How to change it**: Edit the segments or composed string in `lib/builder-v2/prompts/system-prompt.ts`, then run the builder flow; the route uses the imported prompt. For A/B tests or variants, swap or extend segments in that module.

### GET /api/builder/projects

List builder projects for the authenticated user.

**Authentication**: Required

**Response**: 200 OK — array of projects (id, name, files, created_at, updated_at).

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/builder/projects

Create a builder project (name, files).

**Authentication**: Required

**Request Body**: `{ "name": "string", "files": [{ "path", "content", "language" }] }`

**Response**: 201 Created — created project.

**Error responses**: 401 Unauthorized, 400 Validation error, 500 Internal Server Error

---

### GET /api/builder/projects/[id]

Get a single builder project by ID. **PATCH** to update (appends version snapshot). **DELETE** to remove.

**Authentication**: Required (own project only)

**Error responses**: 401 Unauthorized, 404 Not found, 500 Internal Server Error

---

### POST /api/builder/deploy

Deploy a builder project (e.g. to Vercel). Request body and response shape are implementation-specific.

**Authentication**: Required

**Rate limits**: See [Rate Limiting](#rate-limiting).

---

## Flow

### GET /api/flow/collections

List flow collections for the authenticated user.

**Authentication**: Required

**Response**: 200 OK — array of collections.

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/flow/collections

Create a flow collection. Request body and response shape are implementation-specific.

**Authentication**: Required

---

## Credits

### GET /api/credits

Get the authenticated user's credit balance and usage.

**Authentication**: Required

**Response**: 200 OK — balance and optional usage summary.

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### GET /api/credits/referral

Get referral program info or referral link for the user.

**Authentication**: Required

---

### POST /api/credits/earn

Earn credits (e.g. via referral or task). Request body and response shape are implementation-specific.

**Authentication**: Required

---

## Workspace

### GET /api/workspace/folders

List workspace folders for the authenticated user.

**Authentication**: Required

**Response**: 200 OK — array of folders.

**Error responses**: 401 Unauthorized, 500 Internal Server Error

---

### POST /api/workspace/folders

Create a workspace folder.

**Authentication**: Required

---

### GET /api/workspace/search

Search workspace creations. Query params: q, type, limit, offset.

**Authentication**: Required

---

### GET /api/workspace/creations/[id]/activity

Get activity log for a workspace creation.

**Authentication**: Required (own creation only)

---

### GET /api/workspace/creations/[id]/share

Get or manage share settings for a workspace creation.

**Authentication**: Required (own creation only)

---

## Additional API routes (full index)

Every public endpoint under `/api` is listed below. Auth: **Required** (session or Bearer; BYPASS_AUTH in dev), **Optional** (works without auth), **Admin** (admin role), **Webhook** (signed/Stripe).

### Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/chat/export | Required | Export conversation; query: conversationId, format (json \| markdown). PDF returns 501. |
| GET | /api/chat/folders | Required | List chat folders. |
| POST | /api/chat/folders | Required | Create folder. |
| GET | /api/chat/folders/[folderId] | Required | — |
| PATCH | /api/chat/folders/[folderId] | Required | Update folder. |
| DELETE | /api/chat/folders/[folderId] | Required | Delete folder. |
| GET | /api/chat/templates | Required | List chat templates. |
| GET | /api/chat/shared/[slug] | No | Get shared conversation by slug. |
| GET | /api/chat/search | Required | Search chat history. |
| POST | /api/chat/share | Required | Share a conversation. |
| POST | /api/chat/compare-models | Required | Compare AI models. |
| POST | /api/chat/upload | Required | Upload file for chat. |

### Learn (notebooks, quizzes, ai-mentors, badges)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/learn/notebooks | Required | List NairiBook notebooks. |
| POST | /api/learn/notebooks | Required | Create notebook. |
| GET | /api/learn/notebooks/[id] | Required | Get notebook. |
| PATCH | /api/learn/notebooks/[id] | Required | Update notebook. |
| DELETE | /api/learn/notebooks/[id] | Required | Delete notebook. |
| POST | /api/learn/notebooks/[id]/generate | Required | Generate notebook content. |
| POST | /api/learn/notebooks/[id]/sources | Required | Add source. |
| POST | /api/learn/notebooks/[id]/sources/upload | Required | Upload source file. |
| DELETE | /api/learn/notebooks/[id]/sources/[sourceId] | Required | Remove source. |
| POST | /api/learn/notebooks/[id]/chat | Required | Chat with notebook context. |
| GET | /api/learn/quizzes | Required | List quizzes (query params). |
| GET | /api/learn/quizzes/[id] | Required | Get quiz. |
| POST | /api/learn/quizzes/[id]/attempt | Required | Submit attempt. |
| GET | /api/learn/quizzes/[id]/attempt | Required | Get attempt status. |
| GET | /api/learn/ai-mentors | Required | List AI mentors. |
| POST | /api/learn/ai-mentors | Required | Create/register mentor. |
| GET | /api/learn/ai-mentors/[domain] | Required | Get mentor by domain. |
| PATCH | /api/learn/ai-mentors/[domain] | Required | Update mentor. |
| GET | /api/badges | Required | List badges (system or user). |
| GET | /api/users/[userId]/badges | Required | List badges for user. |
| POST | /api/users/[userId]/badges | Required | Award badge to user. |

### Marketplace (products, reviews, earnings)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/marketplace/search | Optional | Search marketplace; query param q. |
| GET | /api/marketplace/reviews | Required | List reviews (query). |
| POST | /api/marketplace/reviews | Required | Submit review. |
| PATCH | /api/marketplace/reviews | Required | Update own review. |
| GET | /api/marketplace/earnings | Required | Creator earnings (GET). |
| POST | /api/marketplace/earnings | Required | Creator payout/request. |
| GET | /api/marketplace/agents/[agentId]/reviews | No | List reviews for an agent. |
| POST | /api/marketplace/agents/[agentId]/reviews | Required | Post review for agent. |
| POST | /api/marketplace/products | Required | Create product. |
| GET | /api/marketplace/products/[id] | Required | Get product. |
| PATCH | /api/marketplace/products/[id] | Required | Update product. |
| POST | /api/marketplace/products/[id]/purchase | Required | Purchase product. |
| GET | /api/marketplace/purchase | Required | Get purchase history/status. |

### Knowledge

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/knowledge/query | Required | Query knowledge graph. |
| GET | /api/knowledge/nodes | Required | List knowledge nodes. |
| POST | /api/knowledge/nodes | Required | Create node. |
| GET | /api/knowledge/edges | Required | List edges. |
| POST | /api/knowledge/edges | Required | Create edge. |
| GET | /api/knowledge/graph | Required | Get graph structure. |

### Search, profile, usage, auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/search | Required | Global search (q, types, limit). |
| GET | /api/profile | Required | Get profile. |
| PATCH | /api/profile | Required | Update profile. |
| DELETE | /api/profile | Required | Delete account. |
| GET | /api/usage | Required | Usage stats (monthly, by type). |
| GET | /api/rate-limit/usage | Required | Rate limit usage. |
| POST | /api/auth/verify-signup | No/Bypass | Verify signup (email). |
| POST | /api/auth/check-fingerprint | Required | Check device fingerprint. |

### Studio, video-tools, image-tools, audio-tools

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/studio/generate | Required | Studio generate (image/video/audio). |
| POST | /api/studio/image | Required | Studio image generation. |
| POST | /api/studio/presentation | Required | Studio presentation flow. |
| GET | /api/video-tools | Required | List video tools. |
| POST | /api/video-tools | Required | Invoke video tool. |
| POST | /api/video-tools/upscale, transform, extend | Required | Video operations; GET for status. |
| GET | /api/image-tools | Required | List image tools. |
| POST | /api/image-tools | Required | Invoke image tool. |
| POST | /api/image-tools/face-restore, blend | Required | Face restore, blend; GET for status. |
| GET | /api/audio-tools | Required | List audio tools. |
| POST | /api/audio-tools | Required | Invoke audio tool. |
| POST | /api/audio-tools/separate | Required | Source separation; GET for status. |

### Generate (image, video, audio, document, etc.)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/generate-image | Required | Generate image; GET for status. |
| POST | /api/generate-image/edit, inpaint, img2img, controlnet, character, enhance-prompt | Required | Image variants; GET for status. |
| POST | /api/generate-document | Required | Generate document; GET for status. |
| POST | /api/generate-presentation | Required | Generate presentation; GET for status. |
| POST | /api/generate-video | Required | Generate video; GET for status. |
| POST | /api/generate-video/long-form | Required | Long-form video; GET for status. |
| POST | /api/generate-vocals | Required | Generate vocals; GET for status. |
| POST | /api/generate-song | Required | Generate song; GET for status. |
| POST | /api/generate-music | Required | Generate music; GET for status. |
| POST | /api/generate-music/continue | Required | Continue music; GET for status. |
| POST | /api/generate-lyrics | Required | Generate lyrics; GET for status. |
| POST | /api/generate-audio | Required | Generate audio; GET for status. |
| POST | /api/generate-sfx | Required | Generate SFX; GET for status. |
| POST | /api/generate-simulation | Required | Generate simulation; GET for status. |
| POST | /api/generate-avatar | Required | Generate avatar; GET for status. |
| POST | /api/generate-avatar/full-body | Required | Full-body avatar; GET for status. |
| POST | /api/generate-3d | Required | Generate 3D; GET for status. |
| POST | /api/generate-3d/texture, scene, animate | Required | 3D sub-ops; GET for status. |
| POST | /api/generate-chart | Required | Generate chart; GET for status. |
| POST | /api/generate-slide-images | Required | Generate slide images. |
| POST | /api/generate | Required | Unified generate. |
| POST | /api/generate/project | Required | Generate project. |
| POST | /api/voice-clone | Required | Voice clone; GET for status. |
| POST | /api/code-agent | Required | Code agent. |
| POST | /api/research | Required | Deep research. |

### Builder (projects, deploy, code-quality, versions)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/builder/versions | Required | List builder versions. |
| POST | /api/builder/versions | Required | Create version. |
| POST | /api/builder/code-quality | Required | Analyze code quality. |
| GET | /api/builder/projects/[id]/collaborators | Required | List collaborators. |
| POST | /api/builder/projects/[id]/collaborators | Required | Add collaborator. |
| POST | /api/builder/projects/[id]/fork | Required | Fork project. |
| POST | /api/builder/deploy | Required | Deploy project. |

### Presentations (collaborators, versions, comments)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/presentations/[id]/collaborators | Required | List collaborators. |
| POST | /api/presentations/[id]/collaborators | Required | Add collaborator. |
| GET | /api/presentations/[id]/versions | Required | List versions. |
| POST | /api/presentations/[id]/versions | Required | Create version. |
| GET | /api/presentations/[id]/comments | Required | List comments. |
| POST | /api/presentations/[id]/comments | Required | Add comment. |

### Workspace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/workspace/folders | Required | List folders. |
| POST | /api/workspace/folders | Required | Create folder. |
| GET | /api/workspace/search | Required | Search workspace; q, type, limit, offset. |
| GET | /api/workspace/creations/[id]/activity | Required | Activity log for creation. |
| POST | /api/workspace/creations/[id]/share | Required | Share creation. |

### Credits, export, upload, other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/credits | Required | Get balance. |
| POST | /api/credits | Required | Add/purchase credits. |
| GET | /api/credits/referral | Required | Referral info. |
| POST | /api/credits/referral | Required | Apply referral. |
| POST | /api/credits/earn | Required | Earn (e.g. reward). |
| GET | /api/credits/earn | Required | Earn history. |
| POST | /api/export/pdf | Required | Export to PDF; GET for status. |
| POST | /api/export-pptx | Required | Export to PPTX; GET for status. |
| POST | /api/export | Required | Generic export. |
| POST | /api/upload | Required | Generic file upload. |
| GET | /api/upload | Required | List/uploads. |
| GET | /api/education | Optional | List education content. |
| POST | /api/education | Required | Create/update education content. |
| POST | /api/document-tools | Required | Document tools; GET list. |
| POST | /api/import-document | Required | Import document; GET status. |
| GET | /api/agents | Required | List agents. |
| POST | /api/agents | Required | Create agent. |
| GET | /api/prompts | Required | List prompts. |
| POST | /api/prompts | Required | Create prompt. |
| GET | /api/activity | Required | Activity feed. |
| POST | /api/activity | Required | Log activity. |
| GET | /api/notifications | Required | List notifications. |
| PATCH | /api/notifications | Required | Update (e.g. read). |
| DELETE | /api/notifications | Required | Delete notification. |
| GET | /api/traces | Required | List traces. |
| POST | /api/traces | Required | Create trace. |
| PATCH | /api/traces | Required | Update trace. |
| POST | /api/preview | Required | Preview. |
| GET | /api/latency | No | Latency check. |
| GET | /api/health/liveness | No | Liveness probe. |
| GET | /api/health/readiness | No | Readiness (checks DB). |
| GET | /api/v1/health | No | Versioned health. |
| GET | /api/test-groq | No | Test Groq (dev; guard in prod). |
| POST | /api/seed | Server-only | Seed DB (dev only; protect in production). |
| GET | /api/seed | Server-only | Seed status. |

### Workflows and webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/workflows | Required | List workflows. |
| POST | /api/workflows | Required | Create workflow. |
| PUT | /api/workflows | Required | Update workflow. |
| DELETE | /api/workflows | Required | Delete workflow. |
| POST | /api/workflows/execute | Required | Execute workflow. |
| GET | /api/workflows/execute | Required | Execution status. |
| DELETE | /api/workflows/execute | Required | Cancel execution. |
| GET/POST/PUT/DELETE/PATCH | /api/workflows/webhook | Webhook | Workflow webhook receiver. |
| POST | /api/webhooks/stripe | Webhook | Stripe webhook (signature verified). |
| POST | /api/webhooks/stripe | Webhook | Stripe webhooks (signature verified). |

**Rate limits**: See [Rate Limiting](#rate-limiting). Typical limits: chat 20/min, generate-presentation 5/min, builder/generate 10/min, marketplace 100/min, profile/usage 30/min.

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "messages",
        "message": "messages is required"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse.

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/chat | 20 requests | 1 minute |
| /api/generate-presentation | 5 requests | 1 minute |
| /api/builder/generate | 10 requests | 1 minute |
| /api/marketplace/* | 100 requests | 1 minute |
| /api/profile, /api/usage | 30 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1707148800
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Public API (developer platform)

External developers can integrate with Nairi via a documented, versioned API.

- **Surface:** The same routes under `/api` (and `/api/v1`) can be used as the public API; alternatively a dedicated prefix (e.g. `/api/v2/public/*`) may be introduced for a stable subset (health, chat, marketplace agents, presentations CRUD).
- **Authentication:** Today: Bearer token (Supabase session). **Planned:** API key auth for server-to-server: send `Authorization: Bearer <api_key>` or `X-API-Key: <api_key>`; keys are scoped and revocable.
- **Versioning:** Path-based (e.g. `/api/v1/...`) or header `Accept: application/vnd.nairi.v1+json`. Deprecation and sunset headers as in [Versioning](#versioning).
- **Documentation:** This document is the source of truth; a “Public API” subsection or separate developer portal can mirror it. Optional: developer signup and key management UI (e.g. Settings > API keys or `/developers`).

## Outbound webhooks and integrations

**Planned.** Notify external systems on key events (Stripe-style). Events (e.g. `conversation.created`, `creation.completed`, `subscription.updated`); payload signed with HMAC; users register endpoint URL and optional secret; retry with backoff. Document event types and payload shape when implemented.

---

## Versioning

The API uses URL-based versioning:

- **Current (unversioned)**: `/api/*` - Latest stable version
- **v1**: `/api/v1/*` - Version 1 (stable)

### Deprecation policy

When retiring or changing an endpoint in a breaking way: (1) introduce a new versioned path or header (e.g. `/api/v2/...`); (2) add response headers `Deprecation: true`, `Sunset: <date>` (RFC 8594), and optional `Link` to migration docs; (3) keep the old endpoint available for at least 12 months; (4) document the change and migration steps in this doc or a dedicated migration guide.

### Version Migration

When a new API version is released:

1. Previous versions remain available for 12 months
2. Deprecation warnings are added to response headers
3. Migration guides are provided in documentation

### Deprecation Header

```http
Deprecation: true
Sunset: Wed, 05 Feb 2027 00:00:00 GMT
Link: <https://docs.nairi.ai/api/migration/v1-to-v2>; rel="deprecation"
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'gpt-4',
    provider: 'openai',
  }),
})

const reader = response.body?.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(new TextDecoder().decode(value))
}
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json',
}

data = {
    'messages': [{'role': 'user', 'content': 'Hello!'}],
    'model': 'gpt-4',
    'provider': 'openai',
}

response = requests.post(
    'http://localhost:3000/api/chat',
    headers=headers,
    json=data,
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

---

## Support

For API support:

- **Documentation**: https://docs.nairi.ai
- **GitHub Issues**: https://github.com/nairi/nairi_v34/issues
- **Email**: support@nairi.ai

---

**Last Updated**: February 13, 2026  
**API Version**: 1.0.0
