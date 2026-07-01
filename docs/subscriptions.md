# Subscriptions & Billing

End-to-end reference for the subscription subsystem: tier catalogue, the generic
quota framework, Stripe billing, the config-gated reverse-trial, lifecycle
emails, and the ops/bootstrap order.

Everything here is **product-agnostic**. There are no AI-model or content
specifics — the quota framework meters generic "units" and a product maps them to
whatever it charges for.

---

## At a glance

| Piece | Where |
|---|---|
| Schema (5 tables) | `src/models/schema/{subscription-tiers,user-subscriptions,tier-quotas,resource-usage,stripe-webhook-events}.ts` |
| Quota framework | `src/libs/subscriptions/{period,usage,quota,get-subscription-usage}.ts` |
| Stripe client + webhook | `src/libs/stripe/client.ts`, `src/app/api/stripe/webhook/route.ts` (idempotency ledger: `stripe_webhook_events`) |
| Billing actions | `src/libs/actions/billing.ts` (`createCheckoutSession`, `createPortalSession`) |
| Blocking helper | `src/libs/jobs/blocking.ts` (`blockScheduledTasksForUser`) |
| Reverse-trial crons | `src/libs/inngest/functions/{force-expire-trials-and-promotions,trial-promotion-expiry-warnings}.ts` |
| Lifecycle emails | `src/libs/email/sendSubscriptionEmails.tsx` + `templates/{ExpiryReminder,SubscriptionStarted,SubscriptionEnded,PromotionGranted}Email.tsx` |
| UI | `src/components/subscriptions/*`, hook `src/libs/hooks/use-subscription-usage.ts` |
| Config | `src/libs/Env.ts`, `.env.example`, `src/libs/analytics/events.ts` |
| SQL homes | `supabase/seed.sql`, `supabase/prod-setup.sql` |

---

## Tiers & lifecycle states

`subscription_tiers` is a lookup catalogue. Three generic slugs are seeded
(`supabase/seed.sql`); a product keeps the slugs and replaces the display copy +
Stripe price ids:

- **free** — the default tier. No premium pool, a modest fallback budget.
- **pro** — the paid tier (has Stripe price ids monthly/yearly).
- **promotion** — optional, admin-granted full access with its own `expires_at`.
  Coherent with the subsystem but adds surface; drop it if you don't need
  admin-granted access.

Each user has exactly one `user_subscriptions` row (created by the signup
trigger). Its `status` is one of `active | trial | expired | cancelled`
(text-typed union, guarded by a CHECK in prod-setup.sql). `billing_interval` is
`monthly | yearly | null`.

---

## Quota framework (generic two-pool metering)

The framework is AI-agnostic. Each `(tier, resource_type)` row in `tier_quotas`
defines two pools a request draws from **in order**:

- **premium** — used while budget remains (`premium_units_used < premium_period_limit`).
- **fallback** — the always-configured pool used once premium is exhausted.

`premium_unit_key` / `fallback_unit_key` are opaque labels (nullable premium key
= no premium pool). A product maps them to whatever it meters: AI model ids, a
rate-limit bucket, a credit type. **Units** are generic integers — tokens, API
calls, generations.

A pool with a **zero** `period_limit` is explicitly disabled for that tier (never
"infinite budget"). Setting both limits to 0 blocks the resource entirely for
that tier.

### Rolling period + anchor reset

`getCurrentPeriod(anchorAt)` (`period.ts`) returns the current rolling window
(`PERIOD_MS`, default 7 days). The anchor is `user_subscriptions.current_period_anchor_at`
(falling back to `started_at`). It is **reset to now on every tier transition**
(trial→active, →free, etc.) so a user's first window after a change starts at the
change, not at signup.

### Resolving + gating

`checkQuota(user, resourceType)` / `checkQuotaByUserId(userId, resourceType)`
(`quota.ts`) return a `QuotaDecision`:

- `enforce: true` (default) — full gate. `allowed` reflects real usage; emits a
  `quota_limit_reached` analytics event when both pools are exhausted.
- `enforce: false` — selection only; `allowed` is always true but `unitKey` is
  still premium-aware (downgrades to fallback when premium is spent).

State is cached in-memory for 60s; invalidate with `invalidateQuotaCache(userId, resourceType)`
after recording usage or on a billing transition.

`recordUsage(userId, resourceType, unitKey, units, premiumUnitKey)` (`usage.ts`)
upserts the period ledger atomically, retrying once on transient pg errors
(deadlock `40P01` / serialization `40001`) and warning Sentry (never throwing)
if it still fails — usage recording must not break the user's request.

### Lazy vs cron expiry

A trial/promotion can expire between cron ticks. `quota.ts` handles this **lazily**:
on the next quota read it detects the passed `trial_expires_at` / `expires_at`,
demotes the user to free, blocks their scheduled tasks, and re-reads. The daily
cron (below) is the eager counterpart.

---

## Stripe

`getStripe()` (`client.ts`) is a lazy singleton — it only constructs when
`STRIPE_SECRET_KEY` is set, so an unconfigured fork builds fine. The API version
is pinned to the SDK's shipped version; bump it (and re-test) on a major upgrade.

**Webhook** (`/api/stripe/webhook`) handles four events. It uses Stripe's own
`constructEvent` signature verification — it is **intentionally not** routed
through `withWebhookSecret` (that guards `X-Webhook-Secret` inbound hooks, a
different mechanism). `runtime = 'nodejs'` is required.

| Event | Effect |
|---|---|
| `checkout.session.completed` | Map price→tier, set status active/trial, reset anchor, send "started" email, track `subscription_converted` (checkout) |
| `invoice.paid` | Confirm/restore `active`; if it observes a trial→active transition, reset anchor + track `subscription_converted` (trial_upgrade) |
| `customer.subscription.updated` | Re-map tier, sync status, reset anchor on trial→active (track conversion), record `cancel_at` → `expires_at` |
| `customer.subscription.deleted` | Downgrade to free, block scheduled tasks, send "ended" email, track `subscription_cancelled` |

**Idempotency & ordering.** Every delivery is recorded in `stripe_webhook_events`
(`event.id` PK) before processing; a re-delivery (Stripe retries the same id on a
non-2xx) short-circuits with `200 { duplicate: true }` so the analytics events +
lifecycle emails fire exactly once. If the handler throws after claiming the id,
the claim is released so the retry re-processes cleanly. The trial→active anchor
reset + `trial_upgrade` conversion are **order-independent**: whichever of
`invoice.paid` / `customer.subscription.updated` observes the local status still
`trial` performs them and flips the row to `active`; the later event sees `active`
and skips — so they happen once regardless of delivery order.

Cache invalidation is generic: it iterates the resource types defined across all
tiers (vs a hardcoded resource list).

**Billing actions** (`billing.ts`) return `ActionResult<T>` via `withActionAuth`:
`createCheckoutSession(tierName, { interval })` and
`createPortalSession({ intent })`. The success/return path is a single
`BILLING_RETURN_PATH` const at the top of the file — repoint it to your billing
page.

---

## Reverse-trial (opt-in)

Reverse-trial = enroll every new user in an N-day trial on Pro (no card), then
auto-demote. It is layered on top of the subsystem as **two independent opt-in
switches**:

1. **Signup enrollment** — the `handle_new_user_subscription` trigger in
   `prod-setup.sql`. It ships enrolling users on the **free** tier
   (safe-by-default). To enable the trial, swap in the commented Pro-trial
   variant in that file and re-run it.
2. **TS layer** — `ENABLE_REVERSE_TRIAL` (env). When `false` (default) the two
   expiry crons no-op. Flip to `true` when you enable the trigger variant.

> ⚠️ **Dual-source `TRIAL_DAYS` caveat.** The trial length lives in two places:
> the `TRIAL_DAYS` env var (gates the TS crons / UI) **and** the `INTERVAL '14 days'`
> literal in the SQL trigger (SQL can't read a TS env var). Keep them in sync.

### Crons (Inngest)

Both are registered in `src/app/api/inngest/route.ts` and no-op internally when
`ENABLE_REVERSE_TRIAL` is off. Ordering matters — the warning runs **before** the
demotion so the nudge lands first:

- **09:00 UTC** — `trial-promotion-expiry-warnings`: sends T-3 / day-of / T+1
  emails for trials + promotions, with a 12h idempotency guard per user
  (`last_trial_warning_sent_at` / `last_promotion_warning_sent_at`).
- **10:00 UTC** — `force-expire-trials-and-promotions`: demotes expired trials +
  promotions to free, blocks their scheduled tasks, invalidates their caches.

Both export their body as a named function so tests exercise the logic directly
(matches the template's `scheduled-tasks.ts` pattern).

### Blocking helper

`blockScheduledTasksForUser(userId, reason)` (`src/libs/jobs/blocking.ts`)
transitions a downgraded user's `scheduled` tasks to `blocked` (free-text
`blocked_reason`). This is the documented use of the template's `scheduled_tasks.blocked`
status — no new table, no subscription dependency on the jobs schema.

---

## Lifecycle emails

Built on the template email system (`sendEmailAsync` fire-and-forget,
`EmailLayout` primitives, the lifecycle sender persona). **All product copy is in
props** (`appName` from `EMAIL_FROM_NAME`, `tierName` from the caller) — the
templates carry no brand strings.

- `ExpiryReminderEmail` — T-3 / day-of (`0`) / T+1 (`-1`) for trial or promotion.
- `SubscriptionStartedEmail` — first paid subscription (Stripe sends its own receipt).
- `SubscriptionEndedEmail` — downgrade to free.
- `PromotionGrantedEmail` — admin-granted access with an expiry date.

> **Promotion-grant entry point is intentionally product-owned.** The subsystem
> ships the promotion *lifecycle* (expiry crons, lazy demotion, the
> `PromotionGrantedEmail` template) but **no grant action** — `sendPromotionGrantedEmail`
> has no caller by design. How a promotion is granted (an admin panel action, a
> CLI, a one-off SQL update) is a product decision, so the grant surface is left to
> the product shell — same as the `/subscriptions` page above. To wire one up, set
> the user's tier to `promotion` with an `expires_at`, then call
> `sendPromotionGrantedEmail`.

---

## UI

The high-value, tested decision logic ships product-agnostic:

- `expiry-banner.tsx` — `pickBanner()` / `thresholdForDays()` decide which
  countdown banner (trial / promotion / cancelled-paid) to show.
- `tier-cta.ts` — `getCtaConfig()` decides each tier card's CTA label/variant.
- `trial-status-pill.tsx`, `tier-card.tsx`, `plan-gate-dialog.tsx` — display
  surfaces with copy/tiers as props.

Data flows through `useSubscriptionUsage()` (`src/libs/hooks/use-subscription-usage.ts`),
a thin TanStack hook over `GET /api/subscriptions/usage` (which calls
`getSubscriptionUsage`). The query key lives in the `queryKeys.subscription`
factory; `useInvalidateSubscriptionUsage()` refreshes it after a billing action.

A full `/subscriptions` page is intentionally left to the product shell — ship
the primitives, compose the page per product.

---

## Bootstrap / ops order

Fresh-environment order (see [`database-workflow.md`](./database-workflow.md) for
the three-home model):

1. `pnpm db:migrate` — creates the 5 tables (journal-driven migration).
2. `psql -f supabase/seed.sql` — seeds the tiers + quota rows. **Required before
   step 3** if you enable the trial trigger (it RAISEs without the tiers), and
   the quota free-tier safety net throws without the seeded free tier.
3. `psql -f supabase/prod-setup.sql` — grants, signup trigger, cross-schema FKs,
   RLS, and the status/`billing_interval` CHECK guards.

**RLS:** `subscription_tiers` + `tier_quotas` are read-only for authenticated
users; `user_subscriptions` is select-own (writes are server-only);
`resource_usage` + `stripe_webhook_events` are server-only (RLS on, no policy).

---

## Related

- [`database-workflow.md`](./database-workflow.md) — three-home migration model.
- [`email-system.md`](./email-system.md) — the email primitives these build on.
- [`patterns/background-jobs.md`](./patterns/background-jobs.md) — the
  `scheduled_tasks` job patterns the blocking helper targets.
