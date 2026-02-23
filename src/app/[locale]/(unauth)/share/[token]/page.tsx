import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { db } from '@/libs/DB';
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

  const [link] = await db
    .select()
    .from(shareableLinks)
    .where(eq(shareableLinks.token, token));

  if (!link) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
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
            This link doesn&apos;t exist or has been removed.
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
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
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

  // Valid link - display content
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
                Shared
                {' '}
                {link.resourceType}
              </h1>
              <p className="text-sm text-muted-foreground">
                Accessed
                {' '}
                {link.accessCount}
                {' '}
                times
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-8 text-center">
            <p className="text-muted-foreground">
              This shared content is not yet available for viewing.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Resource type:
              {' '}
              <span className="font-mono">{link.resourceType}</span>
            </p>
          </div>

          {link.expiresAt && (
            <div className="mt-4 text-sm text-muted-foreground">
              Expires:
              {' '}
              {new Date(link.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
