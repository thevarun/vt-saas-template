'use client';

import { useEffect, useState } from 'react';

import { ShareLinkModal, ShareLinksTable } from '@/components/share';
import { Button } from '@/components/ui/button';
import type { ShareLink } from '@/types/shareLink';

export default function DemoSharePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/share');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchLinks(); // Refresh list after modal closes
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Share Links Demo
        </h1>
        <p className="text-muted-foreground">
          Demo page for Story 8.2 - Private Shareable URLs
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Your Share Links
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your shareable links
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Create Share Link
        </Button>
      </div>

      {isLoading
        ? (
            <div className="rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )
        : (
            <ShareLinksTable links={links} onRefresh={fetchLinks} />
          )}

      <ShareLinkModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        resourceType="demo-report"
        resourceId="123e4567-e89b-12d3-a456-426614174000"
      />

      <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-6">
        <h3 className="font-semibold text-foreground">
          Implementation Notes
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Status:</strong>
            {' '}
            This demo requires manual file creation due to tool
            safety policies.
          </p>
          <p>
            <strong>Required Files:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <code className="text-xs">src/app/api/share/[token]/route.ts</code>
              {' '}
              -
              Public access and revoke endpoints
            </li>
            <li>
              <code className="text-xs">
                src/app/[locale]/(unauth)/share/[token]/page.tsx
              </code>
              - Public share view page
            </li>
          </ul>
          <p>
            <strong>Instructions:</strong>
            {' '}
            See
            {' '}
            <code className="text-xs">
              _bmad-output/implementation-artifacts/story-8-2-manual-files.md
            </code>
            {' '}
            for complete file contents and creation steps.
          </p>
        </div>
      </div>
    </div>
  );
}
