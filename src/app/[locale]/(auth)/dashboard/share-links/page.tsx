'use client';

import { Link2, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ShareLinkModal, ShareLinksTable } from '@/components/share';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShareLink } from '@/types/shareLink';

export default function ShareLinksPage() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState('general');
  const [resourceId, setResourceId] = useState('');

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/share');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreateClick = () => {
    if (!resourceId.trim()) {
      setResourceId(crypto.randomUUID());
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setResourceId('');
    setResourceType('general');
    fetchLinks();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Share Links
            </h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage shareable links for your resources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLinks}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Create form */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Create Share Link</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48 space-y-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger id="resourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="resourceId">Resource ID</Label>
              <Input
                id="resourceId"
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                placeholder="Auto-generates UUID if blank"
              />
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 size-4" />
              Create Link
            </Button>
          </div>
        </div>

        {/* Links table */}
        {loading
          ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-16">
                <RefreshCw className="mb-4 size-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading share links...</p>
              </div>
            )
          : links.length === 0
            ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-16">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Link2 className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-foreground">
                    No share links yet
                  </h3>
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Create your first share link to get started.
                  </p>
                  <Button variant="outline" onClick={handleCreateClick}>
                    <Plus className="mr-2 size-4" />
                    Create Share Link
                  </Button>
                </div>
              )
            : (
                <ShareLinksTable links={links} onRefresh={fetchLinks} />
              )}

        <ShareLinkModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          resourceType={resourceType}
          resourceId={resourceId || crypto.randomUUID()}
        />
      </div>
    </div>
  );
}
