import { randomBytes } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  formatZodErrors,
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
    // Auth check
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createShareLinkSchema.safeParse(body);

    if (!validation.success) {
      return validationError(formatZodErrors(validation.error));
    }

    const { resourceType, resourceId, expiresAt } = validation.data;

    // Generate cryptographically secure token (256 bits of entropy)
    const token = randomBytes(32).toString('base64url');

    // Insert into database
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
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 },
      );
    }

    // Construct full URL
    const baseUrl = new URL(request.url).origin;
    const url = `${baseUrl}/share/${token}`;

    // TODO: Analytics — event: "share_link_created", properties: { resourceType }

    const response: CreateShareLinkResponse = {
      token: newLink.token,
      url,
      expiresAt: newLink.expiresAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/share - List user's share links
 * Requires authentication
 */
export async function GET() {
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

    // Query user's share links
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
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
