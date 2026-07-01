'use server';

import { asc, eq, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { db } from '@/libs/DB';
import { sendPromotionGrantedEmail } from '@/libs/email/sendSubscriptionEmails';
import { logger } from '@/libs/Logger';
import { invalidateAllQuotaCaches } from '@/libs/subscriptions/quota-cache';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';
import type { UserSubscriptionStatus } from '@/models/Schema';
import { subscriptionTiers, userSubscriptions } from '@/models/Schema';

import type { ActionResult } from './types';

// --- Tier slugs -------------------------------------------------------------
//
// The template ships three generic tier slugs (see subscription-tiers.ts):
// 'free', 'pro', 'promotion'. A fork keeps these slugs and only changes the
// display copy. PAID_TIER_NAMES is the set that counts as an active paid plan
// for the promotion-eligibility guard — extend it if a fork adds more paid
// tiers.

const PAID_TIER_NAMES = ['pro'] as const;
const PROMO_TIER_NAME = 'promotion';

// Simple email validation regex (bulk-assign parses a newline-delimited list).
const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

// --- Types ------------------------------------------------------------------

export type UserSubscriptionSummary = {
  id: string;
  tierId: string;
  tierName: string;
  displayName: string;
  status: UserSubscriptionStatus;
  trialExpiresAt: Date | null;
  expiresAt: Date | null;
  startedAt: Date;
};

export type ActiveTier = {
  id: string;
  name: string;
  displayName: string;
};

// --- Zod schemas ------------------------------------------------------------

const assignTierSchema = z
  .object({
    userId: z.string().uuid(),
    tierId: z.string().uuid(),
    status: z.enum(['active', 'trial', 'expired', 'cancelled']),
    trialExpiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    reason: z.string().max(500).optional(),
  })
  .refine(data => !(data.status === 'trial' && !data.trialExpiresAt), {
    message: 'Trial expiry date is required when status is trial',
    path: ['trialExpiresAt'],
  })
  .refine(
    data =>
      !data.trialExpiresAt || new Date(data.trialExpiresAt) > new Date(),
    {
      message: 'Trial expiry date must be in the future',
      path: ['trialExpiresAt'],
    },
  );

const bulkAssignTierSchema = z
  .object({
    emailsRaw: z.string().min(1, 'At least one email is required').max(10_000),
    tierId: z.string().uuid(),
    status: z.enum(['active', 'trial']),
    trialExpiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    // Promotion expiry — required when the resolved tier is the promotion slug and
    // status='active'. Validated server-side after the tier lookup so the client
    // never has to ship the tier name.
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(data => !(data.status === 'trial' && !data.trialExpiresAt), {
    message: 'Trial expiry date is required when status is trial',
    path: ['trialExpiresAt'],
  })
  .refine(
    data =>
      !data.trialExpiresAt || new Date(data.trialExpiresAt) > new Date(),
    {
      message: 'Trial expiry date must be in the future',
      path: ['trialExpiresAt'],
    },
  )
  .refine(data => !data.expiresAt || new Date(data.expiresAt) > new Date(), {
    message: 'Expiry date must be in the future',
    path: ['expiresAt'],
  });

// --- Admin auth guard -------------------------------------------------------

async function requireAdmin(): Promise<
  { userId: string } | { error: ActionResult<never> }
> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: {
        data: null,
        error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' },
      },
    };
  }

  if (!isAdmin(user)) {
    return {
      error: {
        data: null,
        error: {
          message: 'Forbidden: admin access required',
          code: 'FORBIDDEN',
        },
      },
    };
  }

  return { userId: user.id };
}

// --- Server actions ---------------------------------------------------------

/** Lists every tier for the admin grant UI, ordered by the catalogue sort order. */
export async function getActiveTiers(): Promise<ActionResult<ActiveTier[]>> {
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const tiers = await db
      .select({
        id: subscriptionTiers.id,
        name: subscriptionTiers.name,
        displayName: subscriptionTiers.displayName,
      })
      .from(subscriptionTiers)
      .orderBy(asc(subscriptionTiers.sortOrder));

    return { data: tiers, error: null };
  } catch (error) {
    logger.error({ error }, 'getActiveTiers failed');
    return {
      data: null,
      error: { message: 'Failed to fetch tiers', code: 'DB_ERROR' },
    };
  }
}

/** Returns the bare subscription summary for a user (admin detail panel). */
export async function getUserSubscriptionDetail(
  userId: string,
): Promise<ActionResult<UserSubscriptionSummary>> {
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const rows = await db
      .select({
        id: userSubscriptions.id,
        tierId: userSubscriptions.tierId,
        tierName: subscriptionTiers.name,
        displayName: subscriptionTiers.displayName,
        status: userSubscriptions.status,
        trialExpiresAt: userSubscriptions.trialExpiresAt,
        expiresAt: userSubscriptions.expiresAt,
        startedAt: userSubscriptions.startedAt,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionTiers,
        eq(userSubscriptions.tierId, subscriptionTiers.id),
      )
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return {
        data: null,
        error: { message: 'No subscription record found', code: 'NOT_FOUND' },
      };
    }

    return { data: row, error: null };
  } catch (error) {
    logger.error({ error }, 'getUserSubscriptionDetail failed');
    return {
      data: null,
      error: {
        message: 'Failed to fetch subscription detail',
        code: 'DB_ERROR',
      },
    };
  }
}

/**
 * Admin action: assign a tier / status to a single user.
 *
 * Enforces the promotion-eligibility guard (only free/trial users, never active
 * paid users), resets the rolling-period anchor on any tier/status change, and
 * fires the promotion-granted email only on a fresh active promo grant.
 */
export async function assignTier(
  input: unknown,
): Promise<ActionResult<{ userId: string }>> {
  // 1. Validate input.
  const parsed = assignTierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const { userId, tierId, status, trialExpiresAt, expiresAt, reason }
    = parsed.data;

  // 2. Admin auth check.
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return authResult.error;
  }
  const { userId: adminId } = authResult;

  try {
    // 3. Read the old subscription (for the audit trail + eligibility guard).
    const oldRows = await db
      .select({
        tierId: userSubscriptions.tierId,
        tierName: subscriptionTiers.name,
        status: userSubscriptions.status,
        trialExpiresAt: userSubscriptions.trialExpiresAt,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionTiers,
        eq(userSubscriptions.tierId, subscriptionTiers.id),
      )
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    const oldRow = oldRows[0];
    if (!oldRow) {
      return {
        data: null,
        error: { message: 'User subscription not found', code: 'NOT_FOUND' },
      };
    }

    // 4. Resolve the new tier name (for the guard + audit metadata + email).
    const newTierRows = await db
      .select({ name: subscriptionTiers.name })
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, tierId))
      .limit(1);

    const newTierName = newTierRows[0]?.name ?? 'unknown';
    const oldTierName = oldRow.tierName;

    // 4a. Promotion eligibility — only free or trial users may receive a
    // promotion; never demote an active paid user onto it.
    if (
      newTierName === PROMO_TIER_NAME
      && (PAID_TIER_NAMES as readonly string[]).includes(oldTierName)
      && oldRow.status === 'active'
    ) {
      return {
        data: null,
        error: {
          message:
            'Promotion can only be granted to free or trial users — not active paid users.',
          code: 'CONFLICT',
        },
      };
    }

    // 4b. An active promotion needs an expiry — else the lazy-expiry cron
    // (which filters on isNotNull(expiresAt)) never reaps it and the user keeps
    // promo access indefinitely. bulkAssignTier enforces the same guard.
    if (newTierName === PROMO_TIER_NAME && status === 'active' && !expiresAt) {
      return {
        data: null,
        error: {
          message: 'An active promotion grant requires an expiry date.',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // 5. Update the subscription. Reset the rolling-period anchor when the tier
    // or status changes — gives the user a fresh quota window from now.
    const tierChanged = tierId !== oldRow.tierId || status !== oldRow.status;
    await db
      .update(userSubscriptions)
      .set({
        tierId,
        status,
        trialExpiresAt:
          status === 'trial' && trialExpiresAt
            ? new Date(trialExpiresAt)
            : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ...(tierChanged ? { currentPeriodAnchorAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userId));

    // 6. Audit log (best-effort — never blocks the grant).
    void logAdminAction({
      adminId,
      action: 'assign_tier',
      targetType: 'user',
      targetId: userId,
      metadata: {
        reason: reason ?? undefined,
        before: {
          tierId: oldRow.tierId,
          tierName: oldTierName,
          status: oldRow.status,
          trialExpiresAt: oldRow.trialExpiresAt?.toISOString() ?? null,
        },
        after: {
          tierId,
          tierName: newTierName,
          status,
          trialExpiresAt: status === 'trial' ? (trialExpiresAt ?? null) : null,
          expiresAt: expiresAt ?? null,
        },
      },
    });

    // 7. Invalidate the user's quota caches so the new tier takes effect now.
    await invalidateAllQuotaCaches(userId);

    // 8. Notify the user only on a FRESH active promo grant — skip demotions,
    // no-op re-grants, and non-promotion assignments.
    if (
      newTierName === PROMO_TIER_NAME
      && oldTierName !== PROMO_TIER_NAME
      && status === 'active'
      && expiresAt
    ) {
      try {
        const admin = createAdminClient();
        const { data: userData } = await admin.auth.admin.getUserById(userId);
        if (userData?.user?.email) {
          const meta = userData.user.user_metadata as
            Record<string, unknown> | undefined;
          const name
            = typeof meta?.display_name === 'string'
              ? meta.display_name
              : typeof meta?.full_name === 'string'
                ? meta.full_name
                : undefined;
          sendPromotionGrantedEmail({
            email: userData.user.email,
            name,
            tierName: newTierName,
            expiresAt: new Date(expiresAt).toISOString(),
          });
        }
      } catch (emailErr) {
        // Email is best-effort — don't fail the grant on a send error.
        logger.error(
          { err: emailErr, userId },
          'assignTier: failed to send promotion granted email',
        );
      }
    }

    return { data: { userId }, error: null };
  } catch (error) {
    logger.error({ error }, 'assignTier failed');
    return {
      data: null,
      error: { message: 'Failed to assign tier', code: 'DB_ERROR' },
    };
  }
}

/**
 * Admin action: assign a tier / status to many users by email in one batch.
 *
 * Resolves emails to user ids via the Supabase Auth admin API, rejects the whole
 * batch if any active paid user would be demoted onto a promotion, then applies
 * every update in a single transaction.
 */
export async function bulkAssignTier(
  input: unknown,
): Promise<ActionResult<{ updated: string[]; not_found: string[] }>> {
  // 1. Validate input.
  const parsed = bulkAssignTierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const { emailsRaw, tierId, status, trialExpiresAt, expiresAt } = parsed.data;

  // 2. Admin auth check.
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return authResult.error;
  }
  const { userId: adminId } = authResult;

  try {
    // 3. Parse + dedupe the email list.
    const emailSet = new Set(
      emailsRaw
        .split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0 && EMAIL_REGEX.test(e)),
    );

    const emails = [...emailSet];
    if (emails.length === 0) {
      return {
        data: null,
        error: {
          message: 'No valid email addresses found',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // 4. Resolve the new tier name for the guard + audit metadata.
    const newTierRows = await db
      .select({ name: subscriptionTiers.name })
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, tierId))
      .limit(1);

    const tierName = newTierRows[0]?.name ?? 'unknown';

    // A promotion grant needs an expiry — otherwise the lazy-expiry path never
    // fires and the user keeps promo access indefinitely.
    if (tierName === PROMO_TIER_NAME && status === 'active' && !expiresAt) {
      return {
        data: null,
        error: {
          message: 'Expiry date is required when granting an active promotion',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // 5. Look up users by email from Supabase Auth (paginated; max 1000/page).
    const supabaseAdmin = createAdminClient();
    const emailToUserId = new Map<string, string>();

    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (listError) {
        logger.error({ error: listError }, 'bulkAssignTier: listUsers failed');
        return {
          data: null,
          error: { message: 'Failed to look up users', code: 'INTERNAL_ERROR' },
        };
      }

      for (const user of users) {
        const userEmail = user.email?.toLowerCase();
        if (userEmail && emailSet.has(userEmail)) {
          emailToUserId.set(userEmail, user.id);
        }
      }

      if (emailToUserId.size >= emails.length || users.length < 1000) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // 6. Split into found / not-found.
    const updatedEmails: string[] = [];
    const notFoundEmails: string[] = [];
    const foundUserIds: string[] = [];

    for (const email of emails) {
      const uid = emailToUserId.get(email);
      if (uid) {
        updatedEmails.push(email);
        foundUserIds.push(uid);
      } else {
        notFoundEmails.push(email);
      }
    }

    if (foundUserIds.length === 0) {
      return { data: { updated: [], not_found: notFoundEmails }, error: null };
    }

    // 6b. Eligibility check — reject the batch if any active paid user would be
    // demoted onto a promotion (mirrors assignTier's guard).
    if (tierName === PROMO_TIER_NAME) {
      const existingRows = await db
        .select({
          userId: userSubscriptions.userId,
          oldTierName: subscriptionTiers.name,
          oldStatus: userSubscriptions.status,
        })
        .from(userSubscriptions)
        .innerJoin(
          subscriptionTiers,
          eq(userSubscriptions.tierId, subscriptionTiers.id),
        )
        .where(inArray(userSubscriptions.userId, foundUserIds));

      const ineligible = existingRows.filter(
        r =>
          (PAID_TIER_NAMES as readonly string[]).includes(r.oldTierName)
          && r.oldStatus === 'active',
      );
      if (ineligible.length > 0) {
        return {
          data: null,
          error: {
            message: `Promotion cannot be granted to ${ineligible.length} active paid user(s). Remove them from the list or choose a different tier.`,
            code: 'CONFLICT',
          },
        };
      }
    }

    // 7. Apply every update in one transaction.
    const trialDate
      = status === 'trial' && trialExpiresAt ? new Date(trialExpiresAt) : null;
    const expiryDate = expiresAt ? new Date(expiresAt) : null;

    await db.transaction(async (tx) => {
      for (const uid of foundUserIds) {
        await tx
          .update(userSubscriptions)
          .set({
            tierId,
            status,
            trialExpiresAt: trialDate,
            expiresAt: expiryDate,
            currentPeriodAnchorAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, uid));
      }
    });

    // 8. Invalidate quota caches for each found user (best-effort, post-commit).
    for (const uid of foundUserIds) {
      await invalidateAllQuotaCaches(uid);
    }

    // 9. Audit log (best-effort).
    void logAdminAction({
      adminId,
      action: 'bulk_assign_tier',
      targetType: 'user',
      targetId: adminId,
      metadata: {
        tierId,
        tierName,
        status,
        trialExpiresAt: trialDate?.toISOString() ?? null,
        expiresAt: expiryDate?.toISOString() ?? null,
        updated: updatedEmails,
        not_found: notFoundEmails,
        count: updatedEmails.length,
      },
    });

    return {
      data: { updated: updatedEmails, not_found: notFoundEmails },
      error: null,
    };
  } catch (error) {
    logger.error({ error }, 'bulkAssignTier failed');
    return {
      data: null,
      error: { message: 'Failed to bulk assign tier', code: 'DB_ERROR' },
    };
  }
}
