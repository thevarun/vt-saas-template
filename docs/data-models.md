# Data Models

**Generated:** 2026-07-03 | Deep scan

The persistence layer is a Drizzle-defined Postgres schema (applied via journal-driven migrations) whose tables all live in a single non-`public` Postgres schema named by the `DB_SCHEMA` env var (`vt_saas` in every environment, incl. prod). Drizzle is used **for schema-as-code + migrations only**; runtime queries go through the Supabase-JS client. Supabase-specific constructs Drizzle cannot express — schema grants, cross-schema FKs to `auth.users`, RLS policies, CHECK constraints, and the `updated_at`/signup triggers — live in `supabase/prod-setup.sql` and are applied after migrations.

**16 tables** (all in schema `vt_saas`), **3 Postgres enums**, **2 text-backed TS unions**, **6 migrations**.

---

## Schema-naming convention (`DB_SCHEMA`)

Tables are **not** in `public`. They live in a Postgres schema named at runtime by `DB_SCHEMA` (value `vt_saas`). Wiring:

- `src/models/schema/_db-schema.ts` reads `process.env.DB_SCHEMA` (fail-fast throw if unset — no fallback) and exports `vtSaasSchema = pgSchema(DB_SCHEMA_NAME)`. Every table module calls `vtSaasSchema.table(...)`, so the schema name is never hard-coded.
- `src/models/Schema.ts` is a back-compat barrel re-exporting `./schema/index`, which re-exports every table module.
- `drizzle.config.ts` sets `schema: './src/models/schema/index.ts'` and `schemaFilter: [process.env.DB_SCHEMA!]` so drizzle-kit never touches sibling schemas on a shared dev Postgres.
- `src/libs/Env.ts` validates `DB_SCHEMA` (server) and `NEXT_PUBLIC_DB_SCHEMA` (browser) as required and throws if they disagree; the Supabase-JS clients route reads to `NEXT_PUBLIC_DB_SCHEMA` so they hit the same schema Drizzle uses.
- The 3 pg enums are created in `public` (Postgres types are schema-scoped separately from tables); the tables live in `vt_saas`.
- Downstream forks with a dedicated DB may set `DB_SCHEMA=public`; `/init-downstream` renames the schema. `prod-setup.sql` hard-codes `vt_saas` literals and must be find/replaced if `DB_SCHEMA` changes.

## Enums & shared helpers

**Postgres enums** (real `CREATE TYPE`, in `public`):

- `feedback_type` — `bug` | `feature` | `praise`
- `feedback_status` — `pending` | `reviewed` | `archived`
- `scheduled_task_status` — `scheduled` | `claimed` | `running` | `done` | `failed` | `blocked`

**Text-backed TS unions** (plain `text` with Drizzle `$type<>`, guarded by CHECK constraints in `prod-setup.sql` — deliberately not pg enums so forks can add values without `ALTER TYPE`):

- `userSubscriptionStatusEnum` — `active` | `trial` | `expired` | `cancelled` (→ `user_subscriptions_status_check`)
- `billingIntervalEnum` — `monthly` | `yearly` (→ `user_subscriptions_billing_interval_check`)

**Shared helper:** `vtSaasSchema` / `DB_SCHEMA_NAME` from `_db-schema.ts` — the single `pgSchema` instance every table binds to. There is no shared timestamp-column helper; each module repeats `created_at` / `updated_at` inline, and the generic `updated_at` maintenance is done by a DB trigger, not app code.

---

## ER / relationship overview

Two FK worlds:

**Intra-schema FKs (in Drizzle migrations):**

- `tier_quotas.tier_id` → `subscription_tiers.id` (CASCADE)
- `user_subscriptions.tier_id` → `subscription_tiers.id` (NO ACTION)
- `vercel_messages.conversation_id` → `vercel_conversations.id` (CASCADE)
- `mem0_memories.conversation_id` → `vercel_conversations.id` (SET NULL)
- `memory_extraction_jobs.conversation_id` → `vercel_conversations.id` (CASCADE)

**Cross-schema FKs to `auth.users(id)` (only in `prod-setup.sql`, Drizzle-invisible):** `user_preferences.user_id`, `threads.user_id`, `shareable_links.created_by`, `admin_audit_log.admin_id`, `admin_audit_log.target_id` (SET NULL), `feedback.user_id` (SET NULL), `vercel_conversations.user_id`, `mem0_memories.user_id`, `platform_connections.user_id`, `scheduled_tasks.user_id`, `user_subscriptions.user_id`, `resource_usage.user_id` (all CASCADE unless noted).

**Clusters:**

- **Subscription / quota** — `subscription_tiers` ← `tier_quotas`, ← `user_subscriptions`; `resource_usage` is the usage ledger (joined logically by `user_id` + `resource_type`, no FK to tiers).
- **Vercel AI chat** — `vercel_conversations` ← `vercel_messages`, `mem0_memories`, `memory_extraction_jobs`.
- **Dify chat** — `threads` (standalone).
- **Standalone / server-only** — `admin_audit_log`, `feedback`, `shareable_links`, `platform_connections`, `stripe_webhook_events`, `user_preferences`.

---

## Per-table reference

### `admin_audit_log`
Tracks admin actions (suspend/delete/reset). Server-only. `schema/audit.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| admin_id | uuid | no | | FK→auth.users (CASCADE) |
| action | text | no | | |
| target_type | text | no | | |
| target_id | uuid | yes | | FK→auth.users (SET NULL) |
| metadata | jsonb | yes | | |
| created_at | timestamptz | no | now() | |

Created NOT NULL in 0000; `prod-setup.sql` does `ALTER COLUMN target_id DROP NOT NULL` so the SET NULL FK survives a targeted-user delete. **Indexes:** `admin_id`, `created_at`, `(action, created_at)`. **RLS:** enabled, no policy (service-role only).

### `feedback`
User feedback (bug/feature/praise), supports anonymous. `schema/feedback.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| message | text | no | | |
| type | feedback_type | no | | |
| user_id | uuid | yes | | FK→auth.users (SET NULL) |
| user_email | text | yes | | |
| status | feedback_status | no | 'pending' | |
| created_at | timestamptz | no | now() | |
| reviewed_at | timestamptz | yes | | |

**Indexes:** `user_id`, `status`, `created_at`, `(status, created_at)`. **RLS:** `feedback_select_own` + `feedback_insert_own` (`auth.uid() = user_id`); anonymous rows are service-role only.

### `mem0_memories`
Extracted facts/preferences (Mem0) for Vercel AI chat; PII. `schema/vercel-chat.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| conversation_id | uuid | yes | | FK→vercel_conversations (SET NULL) |
| memory_text | text | no | | |
| memory_type | text | yes | | |
| metadata | jsonb | yes | | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Indexes:** `user_id`, `conversation_id`. **RLS:** full own-row CRUD (`auth.uid() = user_id`).

### `memory_extraction_jobs`
Async job queue for memory extraction. Server-only. `schema/vercel-chat.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| conversation_id | uuid | no | | FK→vercel_conversations (CASCADE) |
| status | text | no | | pending / processing / completed / failed |
| error_message | text | yes | | |
| created_at | timestamptz | no | now() | |
| completed_at | timestamptz | yes | | |

**Indexes:** `conversation_id`, `status`, `created_at`. **RLS:** enabled, no policy (server-only).

### `platform_connections`
Encrypted third-party OAuth credentials, one row per (user, provider). `schema/platform-connections.ts`, migration 0001.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| provider | text | no | | |
| access_token | text | no | | AES-256-GCM encrypted |
| encryption_key_version | smallint | no | 1 | |
| refresh_token | text | yes | | encrypted |
| token_expires_at | timestamptz | yes | | |
| provider_account_id | text | no | | OIDC `sub` |
| username | text | no | | |
| display_name | text | yes | | |
| profile_picture_url | text | yes | | |
| scope | text | yes | | |
| status | text | no | 'connected' | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(user_id, provider)`. **Indexes:** `user_id`; partial index on `token_expires_at WHERE token_expires_at IS NOT NULL` (backs the token-refresh cron). **RLS:** full own-row CRUD.

### `resource_usage`
Rolling-period usage ledger for the quota framework; two-pool metering (premium/fallback). Server-only. `schema/resource-usage.ts`, migration 0003.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| resource_type | text | no | | |
| period_start | date | no | | |
| period_end | date | no | | |
| premium_units_used | bigint | no | 0 | |
| fallback_units_used | bigint | no | 0 | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(user_id, resource_type, period_start)`. **Indexes:** `user_id`, `(user_id, resource_type, period_start)`. **RLS:** enabled, no policy (server-only).

### `scheduled_tasks`
Generic background-job lifecycle table (atomic-claim / stale-reset). Server-only. `schema/scheduled-tasks.ts`, migration 0002.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| status | scheduled_task_status | no | 'scheduled' | |
| scheduled_at | timestamptz | no | | |
| blocked_reason | text | yes | | |
| last_error | text | yes | | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Indexes:** `user_id`; partial index on `(status, scheduled_at) WHERE status = 'scheduled'` (backs the claim query). **RLS:** enabled, no policy (server-only).

### `shareable_links`
Private share URLs (token-based) for resources. `schema/share-links.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| token | text | no | | UNIQUE |
| resource_type | text | no | | |
| resource_id | uuid | no | | |
| created_by | uuid | no | | FK→auth.users (CASCADE) |
| expires_at | timestamptz | yes | | |
| access_count | integer | no | 0 | |
| is_active | boolean | no | true | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(token)`. **Indexes:** `created_by`, `(resource_type, resource_id)`. **RLS:** owner policies on `created_by` — `select_own`, `insert_own`, `delete_own` (no update policy).

### `stripe_webhook_events`
Idempotency ledger for the Stripe webhook; PK is Stripe's `event.id`. Server-only. `schema/stripe-webhook-events.ts`, migrations 0004 (create) + 0005 (add `received_at`, relax `processed_at`).

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| event_id | text | no | | PK (Stripe `evt_...`) |
| event_type | text | no | | |
| received_at | timestamptz | no | now() | added in 0005 |
| processed_at | timestamptz | yes | | NULL = reprocessable (relaxed in 0005) |

No FK (keyed solely by Stripe event id). No indexes beyond the PK. **RLS:** enabled, no policy (server-only).

### `subscription_tiers`
Per-tier plan catalogue (lookup table). `schema/subscription-tiers.ts`, migration 0003.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| name | text | no | | UNIQUE (free / pro / promotion) |
| display_name | text | no | | |
| description | text | yes | | |
| price_cents | integer | yes | | |
| stripe_price_id_monthly | text | yes | | |
| stripe_price_id_yearly | text | yes | | |
| is_active | boolean | no | true | |
| sort_order | integer | no | 0 | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(name)`. **Indexes:** `sort_order`. **Referenced by:** `tier_quotas.tier_id`, `user_subscriptions.tier_id`. **RLS:** `subscription_tiers_select_authenticated` (read-only for signed-in users).

### `threads`
Multi-threaded chat conversations for the **Dify** stack. `schema/threads.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| conversation_id | text | no | | UNIQUE (Dify id) |
| title | text | yes | | |
| last_message_preview | text | yes | | |
| archived | boolean | no | false | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(conversation_id)`. **Indexes:** `user_id`, `(user_id, archived)`. **RLS:** full own-row CRUD.

### `tier_quotas`
Per-tier resource limits (two-pool metering config). `schema/tier-quotas.ts`, migration 0003.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| tier_id | uuid | no | | FK→subscription_tiers (CASCADE) |
| resource_type | text | no | | |
| premium_unit_key | text | yes | | null = no premium pool |
| premium_period_limit | bigint | no | 0 | |
| fallback_unit_key | text | no | | |
| fallback_period_limit | bigint | no | | |
| warning_threshold_pct | integer | no | 90 | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(tier_id, resource_type)`. **Indexes:** `tier_id`, `(tier_id, resource_type)`. **RLS:** `tier_quotas_select_authenticated` (read-only).

### `user_preferences`
Per-user preferences, isolated from `public.user_profiles`; auto-created on signup. `schema/preferences.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | UNIQUE, FK→auth.users (CASCADE) |
| username | text | yes | | UNIQUE |
| display_name | text | yes | | |
| email_notifications | boolean | no | true | |
| language | text | no | 'en' | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(user_id)`, `UNIQUE(username)`. **Indexes:** `user_id`, `username`. **RLS:** `select_own` + `update_own` only (no INSERT policy — rows created by the `handle_new_user` signup trigger).

### `user_subscriptions`
Per-user subscription state + lifecycle anchors; one row per user. `schema/user-subscriptions.ts`, migration 0003.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | UNIQUE, FK→auth.users (CASCADE) |
| tier_id | uuid | no | | FK→subscription_tiers (NO ACTION) |
| status | text (union) | no | 'active' | CHECK in (active/trial/expired/cancelled) |
| billing_interval | text (union) | yes | | CHECK null or (monthly/yearly) |
| has_trialed | boolean | no | false | |
| trial_expires_at | timestamptz | yes | | |
| stripe_subscription_id | text | yes | | |
| stripe_customer_id | text | yes | | |
| started_at | timestamptz | no | now() | |
| current_period_anchor_at | timestamptz | yes | | quota-window anchor |
| expires_at | timestamptz | yes | | |
| last_trial_warning_sent_at | timestamptz | yes | | cron idempotency |
| last_promotion_warning_sent_at | timestamptz | yes | | cron idempotency |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Constraints:** `UNIQUE(user_id)`; CHECK `status`, CHECK `billing_interval` (both in prod-setup.sql). **Indexes:** `user_id`, `tier_id`, `status`. **RLS:** `select_own` only (created by signup trigger, mutated only by server/webhook/cron). **Trigger:** `handle_new_user_subscription()` enrolls new users on `free` (opt-in reverse-trial variant enrolls on `pro`).

### `vercel_conversations`
Conversations for the **Vercel AI SDK** stack (parallel to Dify `threads`). `schema/vercel-chat.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| user_id | uuid | no | | FK→auth.users (CASCADE) |
| title | text | yes | | |
| last_message_preview | text | yes | | |
| archived | boolean | no | false | |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |

**Indexes:** `user_id`, `(user_id, archived)`. **Referenced by:** `vercel_messages`, `mem0_memories`, `memory_extraction_jobs`. **RLS:** full own-row CRUD.

### `vercel_messages`
Individual chat messages for the Vercel AI SDK stack. Server-only. `schema/vercel-chat.ts`, migration 0000.

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| conversation_id | uuid | no | | FK→vercel_conversations (CASCADE) |
| role | text | no | | user / assistant / system |
| content | text | no | | |
| token_count | integer | yes | | |
| latency_ms | integer | yes | | |
| created_at | timestamptz | no | now() | |

**Indexes:** `conversation_id`, `created_at`. **RLS:** enabled, no policy (server-only; scoped via parent conversation, no direct `user_id`).

---

## Migrations

Journal-driven (`migrations/meta/_journal.json`); only `.sql` files listed there run. `db:migrate:ci` applies them at prod build time when `RUN_PROD_MIGRATIONS=true`.

| # | Tag | Summary |
|---|---|---|
| 0000 | glorious_blockbuster | Bootstrap: `CREATE SCHEMA vt_saas`; enums `feedback_status`, `feedback_type`; 9 tables (`admin_audit_log`, `feedback`, `mem0_memories`, `memory_extraction_jobs`, `shareable_links`, `threads`, `user_preferences`, `vercel_conversations`, `vercel_messages`); the 3 intra-schema Vercel-chat FKs + base indexes. |
| 0001 | amused_morlun | `platform_connections` (encrypted OAuth creds), user-provider UNIQUE, user_id index, partial `token_expires_at` index. |
| 0002 | far_the_enforcers | Enum `scheduled_task_status` + `scheduled_tasks` table, user_id index, partial `due` claim index. |
| 0003 | misty_smiling_tiger | Subscription/quota cluster: `resource_usage`, `subscription_tiers`, `tier_quotas`, `user_subscriptions`; `tier_quotas.tier_id` (CASCADE) + `user_subscriptions.tier_id` (NO ACTION) FKs; indexes + uniques. |
| 0004 | black_nomad | `stripe_webhook_events` (PK `event_id`, initial `processed_at` NOT NULL DEFAULT now()). |
| 0005 | third_lord_tyger | Alter `stripe_webhook_events`: drop default + NOT NULL on `processed_at` (NULL = reprocessable); add `received_at timestamptz DEFAULT now() NOT NULL`. |

## Cross-cutting DB objects (from `supabase/prod-setup.sql`, not in Drizzle)

- **Grants:** `anon` → SELECT; `authenticated` / `service_role` → full CRUD on all `vt_saas` tables (+ `ALTER DEFAULT PRIVILEGES` for future tables). The whole schema is REST-exposed via `supabase/config.toml`, making RLS the sole access barrier — hence RLS is enabled on **every** table (deny-by-default).
- **Signup triggers** (both AFTER INSERT on `auth.users`): `handle_new_user()` → inserts a `user_preferences` row; `handle_new_user_subscription()` → inserts a `user_subscriptions` row on the `free` tier (opt-in reverse-trial variant uses `pro`).
- **`updated_at` trigger:** `vt_saas.set_updated_at()` is auto-attached (`trg_<table>_updated_at` BEFORE UPDATE) to every table with an `updated_at` column via a dynamic `information_schema` loop; overrides app-supplied values with `NOW()`.
- **CHECK constraints:** `user_subscriptions_status_check`, `user_subscriptions_billing_interval_check`.
- **12 cross-schema FKs to `auth.users`** — all idempotent `DO $$ IF NOT EXISTS` blocks; `admin_audit_log.target_id` additionally gets `DROP NOT NULL` before its SET NULL FK.

---

**Source of truth:** `src/models/schema/*.ts` (Drizzle) + `migrations/*.sql` + `supabase/prod-setup.sql`. Regenerate `src/libs/supabase/types.ts` with `pnpm db:gen-types` after each migration. See also [database-workflow.md](./database-workflow.md) and [legacy-columns.md](./legacy-columns.md).
