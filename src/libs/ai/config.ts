/**
 * AI quota-pool identifiers.
 *
 * These are a product's chosen values for the generic `tier_quotas.resource_type`
 * (and `resource_usage.resource_type`) text column. They name the AI usage pools
 * a request can draw from — they are NOT model names.
 *
 * Each pool has its own period counter, a per-tier limit, and a per-tier
 * `(premium, fallback)` model pair. The `tier_quotas` row maps each pool to two
 * opaque unit keys: a product mapping this to AI models simply sets the keys to
 * model ids (e.g. premium = `gpt-4o`, fallback = `gpt-4o-mini`). Routes that
 * share a pool share its budget.
 *
 * The framework never interprets these strings — see `src/models/schema/tier-quotas.ts`.
 * Provider setup is single-sourced in `src/libs/vercel-ai/client.ts`; this file
 * is pure pool-identifier config.
 */

/** Quota pool for high-reasoning AI operations. */
export const SMART_RESOURCE_TYPE = 'smart_generation';

/** Quota pool for lightweight / fast AI operations. */
export const FAST_RESOURCE_TYPE = 'fast_generation';
