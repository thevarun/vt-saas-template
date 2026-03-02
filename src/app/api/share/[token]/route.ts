import { and, eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  formatZodErrors,
  goneError,
  internalError,
  invalidRequestError,
  logApiError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/supabase/server';
import { shareableLinks } from '@/models/Schema';
import type { ShareLinkAccessResponse } from '@/types/shareLink';
import {
  updateShareLinkSchema,
} from '@/types/shareLink';

/**
 * GET /api/share/[token] - Public access to shared resource
 * No authentication required
 */
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params;
  try {
    const { token } = params;

    if (!token) {
      return validationError('Token is required');
    }

    const [link] = await db
      .select()
      .from(shareableLinks)
      .where(eq(shareableLinks.token, token));

    if (!link) {
      return goneError('Link expired or revoked');
    }

    const now = new Date();
    const isExpired = link.expiresAt && new Date(link.expiresAt) < now;

    if (!link.isActive || isExpired) {
      return goneError('Link expired or revoked');
    }

    // Increment access count (best-effort, do not block response)
    try {
      await db
        .update(shareableLinks)
        .set({
          accessCount: sql`${shareableLinks.accessCount} + 1`,
          updatedAt: now,
        })
        .where(eq(shareableLinks.token, token));
    } catch (countError) {
      logger.error({ error: countError }, 'Failed to increment share link access count');
    }

    const response: ShareLinkAccessResponse = {
      resourceType: link.resourceType,
      resourceId: link.resourceId,
    };

    return NextResponse.json(response);
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/share/[token]',
      method: 'GET',
    });
    return internalError();
  }
}

/**
 * PATCH /api/share/[token] - Revoke a share link
 * Requires authentication and ownership
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params;
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedError();
    }

    const { token } = params;

    if (!token) {
      return validationError('Token is required');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const validation = updateShareLinkSchema.safeParse(body);

    if (!validation.success) {
      return validationError(formatZodErrors(validation.error));
    }

    const { isActive } = validation.data;

    const now = new Date();
    const [updated] = await db
      .update(shareableLinks)
      .set({
        isActive,
        updatedAt: now,
      })
      .where(
        and(
          eq(shareableLinks.token, token),
          eq(shareableLinks.createdBy, user.id),
        ),
      )
      .returning();

    if (!updated) {
      return notFoundError('Share link');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/share/[token]',
      method: 'PATCH',
    });
    return internalError();
  }
}
