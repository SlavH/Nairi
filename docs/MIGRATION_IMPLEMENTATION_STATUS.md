# Migration Tables – Implementation Status

Tables created by migrations are listed below with whether the app **uses** them (API/lib/page) or they are **schema-only** (no app code references yet).

## Fully implemented (table used in app)

| Table(s) | Where used |
|----------|------------|
| **profiles** | Dashboard, settings, auth, health, admin, marketplace, credits |
| **agents** | Marketplace, creator, chat/agents, recommendations, seed |
| **user_agents** | Marketplace (owned/installed), purchase, Stripe webhook |
| **conversations** | Chat layout, history, conversations API, export, search, sidebar/folders |
| **messages** | Chat API, conversation load, export, search, context-manager |
| **conversation_folders** | `lib/features/chat` (folders CRUD) |
| **subscriptions** | Stripe webhook |
| **creator_profiles** | Marketplace creator, product edit, products API, earnings |
| **marketplace_products** | Marketplace pages, products API, purchase, earnings |
| **product_purchases** | Product purchase flow, product page, earnings |
| **product_reviews** | `app/api/marketplace/reviews` |
| **credit_transactions** | Purchase routes, credits |
| **referrals** | Credits referral API |
| **daily_rewards** | Marketplace earnings API |
| **creations** | Workspace, studio/generate, image/video/audio APIs, search, presentations |
| **activity_logs** | Growth feature, security feature |
| **notifications** | `app/api/notifications`, notification bell, dashboard |
| **usage_logs** | Billing, provider-health, marketplace recommendation |
| **learn_notebooks**, **learn_notebook_sources** | Learn notebooks API & pages (NairiBook) |
| **courses**, **course_modules**, **lessons**, **course_enrollments**, **lesson_progress** | Learn features, progress-tracker, seed |
| **user_skills**, **skill_trees** | Learn skill-tree page, learn features |
| **learning_analytics**, **learning_recommendations** | `lib/learn/progress-tracker.ts` |
| **achievements**, **user_achievements** | Learn achievements API, `lib/learn/achievements.ts` |
| **knowledge_nodes**, **knowledge_edges** | Knowledge API, knowledge page, features |
| **knowledge_queries** | `app/api/knowledge/query` |
| **belief_contradictions** | Knowledge page, `app/api/knowledge/graph` |
| **debate_sessions**, **debate_arguments**, **debate_votes** | Debate UI & vote API |
| **feed_collections**, **collection_posts** | `app/api/flow/collections` |
| **sessions**, **mfa_settings**, **mfa_verifications** | `lib/auth/session-manager.ts`, `lib/auth/mfa.ts` |
| **failed_login_attempts**, **account_lockouts** | `lib/auth/account-lockout.ts` (via RPCs) |
| **rate_limit_events** | `lib/rate-limit/monitoring.ts` |
| **roles**, **permissions**, **role_permissions**, **user_roles** | `lib/auth/rbac.ts` (via `get_user_roles` RPC) |
| **builder_projects**, **builder_project_collaborators**, **builder_project_forks** | Builder projects API (collaborators, fork) |
| **builder_deploys**, **builder_deployments**, **builder_usage** | Builder deploy API, `lib/features/builder` |
| **workspace_folders**, **workspace_shares**, **workspace_activities** | Workspace API (folders, share, activity) |
| **presentation_collaborators**, **presentation_comments**, **presentation_versions** | Presentations API (collaborators, comments, versions) |
| **studio_gallery** | `app/api/studio/gallery` |
| **agent_reviews**, **review_moderation** | `app/api/marketplace/agents/[agentId]/reviews` |
| **audit_log** | `lib/audit.ts` |
| **tempmail_usage_log** | `lib/tempmail-detection.ts` |
| **execution_traces** | `lib/features/workspace` (execution traces list) |
| **migration_status** | Migration runner only |

---

## Schema only (no app usage yet)

These tables exist from migrations but have **no current references** in app/API/lib code. They are ready for future features.

| Table(s) | Migration | Notes |
|----------|-----------|--------|
| **quizzes**, **quiz_questions**, **quiz_attempts** | 008 | Education quizzes – no quiz UI found |
| **ai_mentors** | 008 | No AI mentor feature references |
| **expert_badges**, **user_badges** | 010 | Badges for creators – no badge UI |
| **publications**, **reels**, **knowledge_threads**, **thread_contributions** | 009 | Feed/knowledge structures – feed uses `feed_posts` (see below) |
| **feed_interactions**, **comments**, **follows**, **feed_preferences** | 009 | Feed social – algorithm uses `user_preferences`, `user_follows`, `feed_posts` (may be views or different schema) |
| **reasoning_sessions**, **ai_response_metadata**, **user_goals**, **goal_actions** | 011 | Debate/reasoning extras – no app references |
| **critical_confirmations** | 014 | No references |
| **builder_project_templates** | 030 | No “templates” UI or API |
| **document_templates** | 034 | No references |
| **presentation_templates**, **presentation_branding**, **presentation_analytics** | 032 | No references |
| **workspace_templates**, **workspace_comments** | 035 | No references |
| **studio**: **image_edits**, **video_edits**, **audio_edits** | 036 | No references (only `studio_gallery` used) |
| **knowledge_node_versions**, **knowledge_analytics** | 041 | No references (only `knowledge_queries` used) |
| **debate_analytics** | 039 | No references |
| **post_mentions** (040) | 040 | No references (only `feed_collections` / `collection_posts` used) |
| **feed_posts** | Referenced in 040, seed | Used in seed and flow; table may be created in 009 as `publications` or separate migration – confirm schema |

---

## Summary

- **Implemented:** Core product areas (profiles, agents, chat, conversations/messages/folders, marketplace, credits, creations, learn/notebooks/courses/achievements, knowledge graph, debate, builder, workspace, presentations, studio gallery, auth/sessions/MFA/lockout, RBAC, rate limit, audit, tempmail log, notifications) all have corresponding tables **in use** in the app.
- **Schema only:** Several tables are for **planned or optional** features (quizzes, ai_mentors, badges, full feed/social model, reasoning/goals, execution_traces listing, templates, analytics tables, studio edit history). They are migrated but not yet wired into UI or APIs.

To “fully implement” a schema-only table, add at least one of: API route(s), lib helpers, or UI that read/write it.
