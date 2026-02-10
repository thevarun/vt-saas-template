'use client';

import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ShareLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId: string;
};

const expirationOptions = [
  { value: 'never', label: 'Never' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export function ShareLinkModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
}: ShareLinkModalProps) {
  const [expiration, setExpiration] = useState('never');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Calculate expiration date
      let expiresAt: string | undefined;
      if (expiration !== 'never') {
        const days = Number.parseInt(expiration.replace('d', ''), 10);
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          expiresAt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share link');
      }

      const data = await response.json();
      setGeneratedLink(data.url);

      // TODO: Analytics — event: "share_link_created", properties: { resourceType }

      toast.success('Share link created!');
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // TODO: Analytics — event: "share_link_copied", properties: { resourceType }

      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    setExpiration('never');
    setGeneratedLink(null);
    setCopied(false);
    onClose();
  };

  const truncateUrl = (url: string) => {
    if (url.length <= 40) {
      return url;
    }
    return `${url.slice(0, 35)}...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
          <DialogDescription>
            Generate a secure link to share your
            {' '}
            {resourceType}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expiration Select */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Link expiration</Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger id="expiration">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="space-y-2 duration-200 animate-in fade-in slide-in-from-top-2">
              <Label>Your share link</Label>
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Share this link with anyone
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                    <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-sm text-foreground">
                      {truncateUrl(generatedLink)}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                    aria-label={copied ? 'Copied' : 'Copy link'}
                  >
                    {copied
                      ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3.5" />
                            Copied!
                          </span>
                        )
                      : (
                          <span className="flex items-center gap-1.5">
                            <Copy className="size-3.5" />
                            Copy
                          </span>
                        )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {generatedLink ? 'Done' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
