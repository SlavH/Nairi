# Marketplace Audit — Nairi

Auditor: MARKETPLACE auditor. Scope: `app/marketplace/**`, `app/api/marketplace/**`, `components/marketplace/*`, `lib/marketplace/*`, `lib/features/marketplace`, plus the RLS hardening migration and Stripe webhook that touches marketplace tables.

Method: read every marketplace route + page + component, the 20260804 RLS hardening migration, the Stripe webhook, and the relevant table migrations (`006_create_subscriptions.sql`, `010_create_marketplace_extended.sql`, `037_marketplace_reviews.sql`, `002/003_create_agents/user_agents.sql`, `012_create_credits_system.sql`). No code was modified.

---

## Summary (top 5 risks)

1. **The RLS hardening migration is ineffective for the payment tables because it drops policies by names that do not exist.** Migrations `006`/`010` create `subscriptions_insert_own` / `subscriptions_update_own` / `purchases_own`, but `20260804_harden_rls_policies.sql:12,25` drops `"Users can manage own subscriptions"` and `"Users can create own purchases"`. `DROP POLICY IF EXISTS` silently no-ops, so any authenticated user can still INSERT/UPDATE subscriptions (self-grant paid plans) and INSERT fake `product_purchases` (forge ownership of paid products) — the exact vulns the migration was written to close. The new "view own" policies are simply additive duplicates.
2. **Paid product content leaks to unauthenticated callers.** `products/[id]/route.ts` GET and `search/route.ts` both `select('*')` on `marketplace_products`, returning `full_content` / `file_url` to anyone for published products. The paywall is only enforced in the UI; the API gives the goods away.
3. **Creator earnings are wrong in three incompatible ways.** The credit purchase flow pays creators 70% (`purchase/route.ts:142`, `products/[id]/purchase/route.ts:132`), the create form promises 80% (`create-agent-form.tsx:373,381`), and the earnings dashboard computes 10% (`earnings/route.ts:63,121,129`). Stripe card sales pay creators nothing at all (webhook records the purchase but issues no payout). Separately, the earnings dashboard reads `product_purchases` as the creator and RLS only returns rows where the creator is the buyer (`earnings/route.ts:46-58`), so recentSales/revenue are always empty.
4. **Agent create/edit is completely dead and drafts are public.** There is no INSERT/UPDATE RLS policy on `agents` (only `agents_select_all` from `002`), so the client-side create/update in `create-agent-form.tsx:100-121` is denied; the `system_prompt` column referenced by the form and `edit/[id]/page.tsx:28` does not exist in any migration. Meanwhile every agent listing (`app/marketplace/page.tsx:67`, `agents/route.ts`, `recommendation.ts`, `[id]/page.tsx`) skips the `is_published` filter, so unpublished drafts are publicly visible (RLS allows anon SELECT on all rows).
5. **Agent reviews are broken end-to-end (moderation, listing, and rating).** `agents/[agentId]/reviews/route.ts:102` inserts into `review_moderation` via the user session with the error unhandled; RLS denies it (no INSERT policy ever existed in `037`, and the hardening migration makes it `WITH CHECK (false)`). Because `037`'s `reviews_select_public` only shows reviews with an approved moderation row, submitted reviews are invisible to everyone but the author, and `update_agent_rating` never counts them. The GET listing also fails: the `profiles:user_id(...)` embed has no FK to `profiles` (`agent_reviews.user_id` → `auth.users`), producing a PostgREST relationship error.

---

## Findings

| file:line | severity | issue | suggested fix |
|---|---|---|---|
| supabase/migrations/20260804_harden_rls_policies.sql:12,25 | CRITICAL | Drops policy names that don't exist (`"Users can manage own subscriptions"`, `"Users can create own purchases"`); real policies `subscriptions_insert_own`/`subscriptions_update_own` (006) and `purchases_own` (010) survive, so users can still self-grant plans and forge purchases | Drop the actual names (`DROP POLICY subscriptions_insert_own/update_own`, `purchases_own`) and add service-role-only INSERT/UPDATE (or `WITH CHECK (false)`) |
| app/api/marketplace/products/[id]/route.ts:23-47 | CRITICAL | GET returns `full_content`/`file_url` for any published product with no ownership check → paid content freely downloadable via API | Strip paid fields unless requester owns the product (or is the creator) |
| app/api/marketplace/search/route.ts:69-77 | CRITICAL | Search selects `*` on `marketplace_products`, leaking `full_content`/`file_url` in every result | Explicitly exclude full_content/file_url from the projection |
| scripts/010_create_marketplace_extended.sql:113 | CRITICAL | `creator_profiles_own FOR ALL USING (auth.uid()=user_id)` lets users self-set `is_verified`, `reputation_score`, `follower_count`, `total_earnings_cents` → self-verification + fake reputation (used by `isAgentVerified`) | Split into read + update policies that restrict privileged columns; grant privileged writes only to service_role/RPC |
| app/api/marketplace/earnings/route.ts:46-58 | HIGH | Sales read via user session: RLS returns only rows where creator is the buyer → recentSales/revenue/salesByDay always empty | Read `product_purchases` via admin client scoped to creator products, or add a creator-SELECT policy |
| app/api/marketplace/earnings/route.ts:63,104-105,121,129 | HIGH | Commission math contradicts actual payouts: 10% shown vs 70% paid on credit sales (`purchase/route.ts:142`, `products/[id]/purchase/route.ts:132`) vs 80% promised (`create-agent-form.tsx:373,381`); Stripe sales pay creators 0 | Unify payout % in one constant; implement Stripe payout (transfer) or fix copy; derive dashboard from credit_transactions |
| app/api/marketplace/earnings/route.ts:56-62 | HIGH | totalSales/totalRevenue computed from `.limit(20)` recentSales → undercounts any creator with >20 sales | Use COUNT/SUM aggregations |
| app/api/marketplace/purchase/route.ts:92-123, app/api/marketplace/products/[id]/purchase/route.ts:89-112 | HIGH | Credit purchase is read-then-write (stale balance); concurrent duplicate hits unique(23505), refund path restores stale balance over the successful deduction → double-spend (keep item + keep credits) | Atomic `UPDATE profiles SET tokens_balance = tokens_balance - cost WHERE id=$1 AND tokens_balance >= cost` (RPC), then insert ownership and only refund on real failure |
| app/marketplace/page.tsx:67, app/api/marketplace/agents/route.ts:32, lib/marketplace/recommendation.ts:41-49, app/marketplace/[id]/page.tsx:27 | HIGH | No `is_published` filter on agents anywhere; RLS `agents_select_all USING(true)` → drafts publicly visible and in recommendations | Add `.eq("is_published", true)` in all listings + enforce with an RLS policy |
| components/marketplace/create-agent-form.tsx:100-121, app/marketplace/edit/[id]/page.tsx:28 | HIGH | Agent create/edit dead: no INSERT/UPDATE policy on `agents` (RLS default deny), and `system_prompt` column doesn't exist → create fails, edit page 500s/notFound | Add `agents_insert_own`/`agents_update_own` policies; add `system_prompt TEXT` column migration |
| app/api/marketplace/agents/[agentId]/reviews/route.ts:102 | HIGH | `review_moderation` INSERT via user session denied by RLS (error unhandled) → moderation row never created | Insert moderation via admin client (service_role), check and surface errors |
| scripts/037_marketplace_reviews.sql:84-91, app/api/marketplace/agents/[agentId]/reviews/route.ts:33 | HIGH | `reviews_select_public` hides every review without an approved moderation row (which never gets created) → agent reviews/ratings invisible; GET also fails on `profiles:user_id` embed (FK is to auth.users, not profiles) | Fix moderation insert (above); join profiles explicitly or add FK; consider showing pending reviews pending moderation |
| app/api/marketplace/reviews/route.ts:19-26,76-129 | HIGH | Product reviews GET uses `user:user_id` embed (FK to auth.users, not profiles → 500); POST lets non-purchasers review any product and still counts into rating | Fix join; require purchase (or exclude unverified from rating) + rate limit |
| app/api/marketplace/reviews/route.ts:159-199 | MEDIUM | PATCH helpful_count has no dedup/limit; fallback direct UPDATE lets anyone inflate any review's count | Enforce one vote per user (RPC with unique table) |
| app/api/marketplace/products/[id]/purchase/route.ts:54,101 | MEDIUM | `product_purchases` INSERT via user session contradicts hardening intent (service-role only); works today only because the old `purchases_own` policy survived the name-mismatch | Route purchase inserts through admin client or SECURITY DEFINER RPC |
| app/api/marketplace/agents/[agentId]/install/route.ts:64-67,130-133, app/api/marketplace/purchase/route.ts:61-64,135-138, lib/features/marketplace/index.ts:81-86 | MEDIUM | `agents.usage_count` UPDATE via user session denied by RLS (no UPDATE policy), errors unchecked → usage/popularity metrics silently dead | Check errors; update via admin client/RPC or add owner policy |
| app/marketplace/creator/page.tsx:47-48, components/marketplace/creator-dashboard.tsx:317,321 | MEDIUM | `agent.total_earnings`/`agent.sales_count` don't exist on `agents` → always 0/$0.00; earnings dashboard shows nothing real | Compute from credit_transactions/product_purchases or add columns |
| app/api/marketplace/products/[id]/purchase/route.ts:62-69,122-129, app/api/webhooks/stripe/route.ts:148-156 | MEDIUM | `purchase_count` read-modify-write is not atomic → lost increments on concurrent purchases | Atomic `UPDATE ... SET purchase_count = purchase_count + 1` |
| app/api/marketplace/agents/route.ts:75 | LOW | `total: list.length` is the page size, not the real total (pagination broken) | Use head/count query |
| lib/marketplace/recommendation.ts:47 | LOW | `.not("id","in","(a,b)")` parenthesized list is invalid PostgREST syntax → exclusion filter can fail | Use `.not("id","in", [...])` array form |
| app/api/marketplace/search/route.ts:35-41,17 | LOW | `parseInt` of minPrice/maxPrice/limit can be NaN → query errors; results.sort "popular" mixes usage_count (agents) with purchase_count (products) | Validate numbers; normalize sort key |
| components/marketplace/creator-dashboard.tsx:191-278 | LOW | "Expert badges" card rendered twice (duplicate JSX block) | Delete one block |
| app/api/marketplace/products/route.ts:74 | LOW | No upper bound on `price_cents` (Number coercion) and no rate limit on product creation | Clamp price, add rate limit |

### Cross-cutting (hardening migration vs app code — recon question)

- The migration restricts writes to service_role on `usage_logs`, `user_achievements`, `user_badges`, `rate_limit_events`, `learning_analytics`, `failed_login_attempts`, `review_moderation`. App code still writes via the anon-key session client and will now break silently (errors unhandled): `lib/cost-tracker.ts:35` (`usage_logs` insert), `lib/learn/achievements.ts:43` (`user_achievements` insert), `app/api/marketplace/agents/[agentId]/reviews/route.ts:102` (`review_moderation` insert). Fix: these writers must use `createAdminClient()` or a SECURITY DEFINER RPC.
- `subscriptions` user-session writes exist only in the webhook (admin client) — good; the failure is only the leftover insert/update policies (finding #1).
- The `agent_purchase`/`product_purchase` webhook inserts already run as service_role (`createAdminClient()`, `webhooks/stripe/route.ts:45`) and will keep working after RLS is corrected — the migration intent is sound, the policy names are wrong.

---

## Test gaps

- `e2e/marketplace.spec.ts` — smoke tests only (page loads, one card visible). Nothing exercises install, purchase (credits/Stripe), reviews, earnings, create/edit, or draft-visibility.
- `__tests__/integration/api/marketplace.test.ts` — every assertion accepts multiple statuses (`[200,404,401,403]`) so it can pass while the endpoint is broken; no success-path, ownership, or credit-math verification.
- **No tests for:** `lib/marketplace/recommendation.ts`, `lib/features/marketplace/index.ts`, `earnings/route.ts` math, credit double-spend, RLS policy-name matching of `20260804_harden_rls_policies.sql`, `product_purchases`/`subscriptions` write restrictions, agent create/edit (RLS + `system_prompt`), review moderation insert, paid-content leakage via `products/[id]` GET and `/search`.
- Add: `__tests__/unit/lib/marketplace/recommendation.test.ts`, `__tests__/unit/lib/features/marketplace.test.ts`, `__tests__/api/marketplace/{purchase,earnings,reviews}.test.ts`, and an RLS policy-name contract test (assert migration drops the names 006/010 actually create).

## Quick wins

1. Fix the RLS policy names in `20260804_harden_rls_policies.sql` (drop `subscriptions_insert_own`, `subscriptions_update_own`, `purchases_own`) — closes the self-grant + purchase-forgery vulns with a one-file change.
2. Add `.eq("is_published", true)` to the three agent listing queries + agent detail page (hides drafts).
3. Exclude `full_content`/`file_url` from `products/[id]` GET and `search` projections (or gate on ownership).
4. Make `profiles:user_id` embeds work (add FK or resolve via profiles) and route `review_moderation` inserts through the admin client.
5. Add `agents_insert_own`/`agents_update_own` policies and a `system_prompt` column so agent create/edit works again.
