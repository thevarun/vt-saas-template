import { randomBytes } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  formatZodErrors,
  internalError,
  invalidRequestError,
  logApiError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { shareableLinks } from '@/models/Schema';
import type { CreateShareLinkResponse, ShareLink, ShareLinkListResponse } from '@/types/shareLink';
import {
  createShareLinkSchema,
} from '@/types/shareLink';

/**
 * POST /api/share - Create a new share link
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedError();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const validation = createShareLinkSchema.safeParse(body);

    if (!validation.success) {
      return validationError(formatZodErrors(validation.error));
    }

    const { resourceType, resourceId, expiresAt } = validation.data;

    const token = randomBytes(32).toString('base64url');

    const [newLink] = await db
      .insert(shareableLinks)
      .values({
        token,
        resourceType,
        resourceId,
        createdBy: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    if (!newLink) {
      return internalError('Failed to create share link');
    }

    const baseUrl = new URL(request.url).origin;
    const url = `${baseUrl}/share/${token}`;

    const response: CreateShareLinkResponse = {
      token: newLink.token,
      url,
      expiresAt: newLink.expiresAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/share',
      method: 'POST',
    });
    return internalError();
  }
}

/**
 * GET /api/share - List user's share links
 * Requires authentication
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedError();
    }

    const links = await db
      .select()
      .from(shareableLinks)
      .where(eq(shareableLinks.createdBy, user.id))
      .orderBy(desc(shareableLinks.createdAt));

    const response: ShareLinkListResponse = links.map((link): ShareLink => ({
      ...link,
      createdAt: new Date(link.createdAt),
      updatedAt: new Date(link.updatedAt),
      expiresAt: link.expiresAt ? new Date(link.expiresAt) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/share',
      method: 'GET',
    });
    return internalError();
  }
}
