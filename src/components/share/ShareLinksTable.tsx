'use client';

import { Check, Copy, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ShareLink } from '@/types/shareLink';
import { cn } from '@/utils/Helpers';

type ShareLinksTableProps = {
  links: ShareLink[];
  onRefresh: () => void;
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(setCopied, 2000, false);

      // TODO: Analytics — event: "share_link_copied", properties: { url }

      toast.success('Link copied!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'rounded-md p-1.5 transition-colors duration-200',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      aria-label={copied ? 'Copied' : 'Copy link'}
    >
      {copied
        ? (
            <Check className="size-4 text-emerald-500" />
          )
        : (
            <Copy className="size-4" />
          )}
    </button>
  );
}

export function ShareLinksTable({ links, onRefresh }: ShareLinksTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const truncateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname + urlObj.search;
      if (path.length > 20) {
        return `${urlObj.host}${path.slice(0, 17)}...`;
      }
      return urlObj.host + path;
    } catch {
      return url.length > 30 ? `${url.slice(0, 27)}...` : url;
    }
  };

  const handleRevoke = async (link: ShareLink) => {
    // TODO: Replace with proper AlertDialog component for better UX
    // For now, we'll proceed directly with revoke action
    setDeletingId(link.id);
    try {
      const response = await fetch(`/api/share/${link.token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke link');
      }

      // TODO: Analytics — event: "share_link_revoked", properties: { resourceType: link.resourceType, token: link.token }

      toast.success('Link revoked successfully');
      onRefresh();
    } catch (error) {
      console.error('Error revoking link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke link');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (link: ShareLink) => {
    const now = new Date();
    const isExpired = link.expiresAt && new Date(link.expiresAt) < now;

    if (!link.isActive) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getFullUrl = (token: string) => {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}/share/${token}`;
  };

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-16">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <LinkIcon className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-sm font-medium text-foreground">
          No share links yet
        </h3>
        <p className="text-center text-sm text-muted-foreground">
          Create a share link to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Link</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Access Count</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => {
            const fullUrl = getFullUrl(link.token);
            return (
              <TableRow key={link.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="max-w-[200px] truncate font-mono text-sm text-foreground">
                      {truncateUrl(fullUrl)}
                    </span>
                    <CopyButton url={fullUrl} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {link.resourceType}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {link.resourceId.slice(0, 8)}
                      ...
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(link)}</TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-sm text-foreground">
                    {link.accessCount}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {link.expiresAt
                      ? new Date(link.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(link)}
                    disabled={!link.isActive || deletingId === link.id}
                    aria-label="Revoke link"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
