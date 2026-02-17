import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  formatZodErrors,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
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

    // Query share link
    const [link] = await db
      .select()
      .from(shareableLinks)
      .where(eq(shareableLinks.token, token));

    if (!link) {
      return NextResponse.json(
        { error: 'Link expired or revoked' },
        { status: 410 }, // 410 Gone
      );
    }

    // Check if link is active and not expired
    const now = new Date();
    const isExpired = link.expiresAt && new Date(link.expiresAt) < now;

    if (!link.isActive || isExpired) {
      return NextResponse.json(
        { error: 'Link expired or revoked' },
        { status: 410 },
      );
    }

    // Increment access count (best-effort, do not block response)
    try {
      await db
        .update(shareableLinks)
        .set({
          accessCount: link.accessCount + 1,
          updatedAt: now,
        })
        .where(eq(shareableLinks.token, token));
    } catch (countError) {
      console.error('Failed to increment access count:', countError);
    }

    // TODO: Analytics — event: "share_link_accessed", properties: { resourceType: link.resourceType, token }

    const response: ShareLinkAccessResponse = {
      resourceType: link.resourceType,
      resourceId: link.resourceId,
      // NOTE: In real implementation, fetch the actual resource data here
      // For now, just return the resource identifiers
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error accessing share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
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
    // Auth check
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

    // Parse and validate request body
    const body = await request.json();
    const validation = updateShareLinkSchema.safeParse(body);

    if (!validation.success) {
      return validationError(formatZodErrors(validation.error));
    }

    const { isActive } = validation.data;

    // Query share link to verify ownership
    const [link] = await db
      .select()
      .from(shareableLinks)
      .where(
        and(
          eq(shareableLinks.token, token),
          eq(shareableLinks.createdBy, user.id),
        ),
      );

    if (!link) {
      return notFoundError('Share link not found');
    }

    // Update link status
    const now = new Date();
    await db
      .update(shareableLinks)
      .set({
        isActive,
        updatedAt: now,
      })
      .where(eq(shareableLinks.token, token));

    // TODO: Analytics — event: "share_link_revoked", properties: { resourceType: link.resourceType, token }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
