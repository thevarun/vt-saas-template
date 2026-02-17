# Story 8.2: Manual File Creation Required

Due to tool safety policies, files containing "[token]" in their path cannot be auto-created. Please create these files manually:

## 1. API Route: /api/share/[token]/route.ts

**Path:** `src/app/api/share/[token]/route.ts`

```typescript
import { createClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/libs/DB';
import { shareableLinks } from '@/models/Schema';
import {
  unauthorizedError,
  notFoundError,
  validationError,
  formatZodErrors,
} from '@/libs/api/errors';
import {
  updateShareLinkSchema,
  type ShareLinkAccessResponse,
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
    const db = getDb();
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

    // Increment access count
    await db
      .update(shareableLinks)
      .set({
        accessCount: link.accessCount + 1,
        updatedAt: now,
      })
      .where(eq(shareableLinks.token, token));

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
    const db = getDb();
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
```

## 2. Public Share Page

**Path:** `src/app/[locale]/(unauth)/share/[token]/page.tsx`

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '@/libs/DB';
import { shareableLinks } from '@/models/Schema';

type SharePageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata(props: SharePageProps): Promise<Metadata> {
  const params = await props.params;
  const { token } = params;

  return {
    title: `Shared Content - ${token.slice(0, 8)}`,
    description: 'View shared content',
    robots: 'noindex, nofollow', // Don't index share pages
  };
}

export default async function SharePage(props: SharePageProps) {
  const params = await props.params;
  const { token } = params;

  // Query share link
  const db = getDb();
  const [link] = await db
    .select()
    .from(shareableLinks)
    .where(eq(shareableLinks.token, token));

  if (!link) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="size-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Link Not Found
          </h1>
          <p className="mb-6 text-muted-foreground">
            This link doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Check if link is active and not expired
  const now = new Date();
  const isExpired = link.expiresAt && new Date(link.expiresAt) < now;

  if (!link.isActive || isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="size-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {!link.isActive ? 'Link Revoked' : 'Link Expired'}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {!link.isActive
              ? 'This link has been revoked by the owner.'
              : 'This link has expired and is no longer available.'}
          </p>
          <p className="text-sm text-muted-foreground">
            If you need access, please request a new link from the owner.
          </p>
        </div>
      </div>
    );
  }

  // Valid link - increment access count via API and display content
  // NOTE: In a real implementation, you would fetch the actual resource here
  // For this template, we just show a placeholder

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="size-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Shared {link.resourceType}
              </h1>
              <p className="text-sm text-muted-foreground">
                Accessed {link.accessCount} times
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-8 text-center">
            <p className="text-muted-foreground">
              Resource ID: <span className="font-mono">{link.resourceId}</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              This is a template placeholder. In your implementation, fetch and display
              the actual resource content here based on resourceType and resourceId.
            </p>
          </div>

          {link.expiresAt && (
            <div className="mt-4 text-sm text-muted-foreground">
              Expires: {new Date(link.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Creation Steps

1. Create the directory for the token API route:
   ```bash
   mkdir -p src/app/api/share/[token]
   ```

2. Create `src/app/api/share/[token]/route.ts` with the content from section 1 above

3. Create the directory for the share page:
   ```bash
   mkdir -p src/app/[locale]/(unauth)/share/[token]
   ```

4. Create `src/app/[locale]/(unauth)/share/[token]/page.tsx` with the content from section 2 above

5. Run type checking to verify:
   ```bash
   npm run check-types
   ```

## Already Created Files

The following files have been successfully created:
- ✅ `src/models/Schema.ts` (updated with shareableLinks table)
- ✅ `src/types/shareLink.ts` (TypeScript types and Zod schemas)
- ✅ `src/app/api/share/route.ts` (POST create, GET list)
- ✅ `src/components/share/ShareLinkModal.tsx` (Create link dialog)
- ✅ `src/components/share/ShareLinksTable.tsx` (Manage links table)
- ✅ `src/components/share/index.ts` (Barrel export)
- ✅ Migration generated: `migrations/0006_famous_omega_red.sql`

## Next Steps After Manual Creation

1. Run type checking
2. Write and run tests
3. Visual inspection with Playwright
4. Update sprint status
