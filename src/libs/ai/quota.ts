/**
 * AI-aware model resolvers — a thin, opt-in projection over the generic quota
 * gate in `src/libs/subscriptions/quota.ts`.
 *
 * The engine is product-agnostic: it resolves an opaque `unitKey` per resource
 * pool. An AI product stores model ids in those unit-key columns (see
 * `src/models/schema/tier-quotas.ts`: "a product mapping this to AI models simply
 * sets the keys to model ids"), so this module renames the generic decision into
 * AI vocabulary — `unitKey` → `modelId`, `premiumUnitKey` → `premiumModelId` —
 * and nothing more. The cache, DB load, trial / promotion expiry, and analytics
 * all stay in the engine; this file performs no DB access and emits no events.
 */

import type { User } from '@supabase/supabase-js';

import type { UsageWarning } from '@/libs/subscriptions/quota';
import { checkQuota, checkQuotaByUserId } from '@/libs/subscriptions/quota';

export type { UsageWarning } from '@/libs/subscriptions/quota';

/**
 * AI projection of the engine's generic `Downgrade` (whose `current_unit_key`
 * becomes `current_model` here). Surfaced to callers that want to show a
 * "downgraded to the fallback model" notice.
 */
export type ModelDowngrade = {
  reason: 'premium_exhausted';
  current_model: string;
  resets_at: Date;
};

/**
 * AI projection of the engine's `QuotaDecision`. `modelId` is the model the
 * caller should actually invoke (premium while budget remains, else fallback);
 * `premiumModelId` is the tier's premium model id, needed by `recordUsage` to
 * tag tokens against the correct pool.
 */
export type ModelSelection = {
  /** True when the user can make this call. Always true under `enforce: false`. */
  allowed: boolean;
  /** The model the user should call (premium if budget remains, else fallback). */
  modelId: string;
  /** The tier's premium model id — needed by `recordUsage` for token tagging. */
  premiumModelId: string | null;
  usagePct: { premium: number; fallback: number };
  warning?: UsageWarning;
  downgrade?: ModelDowngrade;
  resetsAt: Date;
};

/** Maps a generic `QuotaDecision` onto AI `ModelSelection` vocabulary. */
function toModelSelection(decision: Awaited<ReturnType<typeof checkQuota>>): ModelSelection {
  const downgrade: ModelDowngrade | undefined = decision.downgrade
    ? {
        reason: decision.downgrade.reason,
        current_model: decision.downgrade.current_unit_key,
        resets_at: decision.downgrade.resets_at,
      }
    : undefined;

  return {
    allowed: decision.allowed,
    modelId: decision.unitKey,
    premiumModelId: decision.premiumUnitKey,
    usagePct: decision.usagePct,
    warning: decision.warning,
    downgrade,
    resetsAt: decision.resetsAt,
  };
}

/**
 * Resolves the model a user should call for a given AI resource pool, gating the
 * call when `enforce: true` (default). Thin projection over {@link checkQuota}.
 */
export async function getModelForUser(
  user: User,
  resourceType: string,
  options?: { enforce?: boolean },
): Promise<ModelSelection> {
  return toModelSelection(await checkQuota(user, resourceType, options));
}

/**
 * `getModelForUser` variant for background callers (Inngest jobs, pipelines) that
 * only have a `userId` string. Thin projection over {@link checkQuotaByUserId}.
 */
export async function getModelByUserId(
  userId: string,
  resourceType: string,
  options?: { enforce?: boolean },
): Promise<ModelSelection> {
  return toModelSelection(await checkQuotaByUserId(userId, resourceType, options));
}
