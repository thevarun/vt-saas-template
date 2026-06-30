'use client';

import { Check, Link, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/Helpers';

import { FacebookIcon, LinkedInIcon, XIcon } from './platformIcons';

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'copy';

type ShareWidgetProps = {
  /** URL to share */
  url: string;
  /** Pre-filled share title/text */
  title: string;
  /** Optional description for platforms that support it + Web Share API */
  description?: string;
  /** Which platforms to show (default: all four) */
  platforms?: Platform[];
  /** Additional CSS classes */
  className?: string;
};

const platformConfig = {
  twitter: {
    label: 'Share on X',
    icon: XIcon,
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  linkedin: {
    label: 'Share on LinkedIn',
    icon: LinkedInIcon,
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  facebook: {
    label: 'Share on Facebook',
    icon: FacebookIcon,
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  copy: {
    label: 'Copy link',
    icon: Link,
    getUrl: () => '',
  },
};

export function ShareWidget({
  url,
  title,
  description,
  platforms = ['copy', 'facebook', 'linkedin', 'twitter'],
  className = '',
}: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(setCopied, 2000, false);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copied]);

  const handleShare = async (platform: Platform) => {
    // TODO: Analytics — event: "share_clicked", properties: { platform, url, page: window.location.pathname }

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      return;
    }

    const shareUrl = platformConfig[platform].getUrl(url, title);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  // Keep description in scope for future native share usage
  void description;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          aria-label="Share"
        >
          <Share2 className="size-4" />
          <span className="text-sm">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[200px] p-1">
        <div className="flex flex-col">
          {platforms.map((platform) => {
            const config = platformConfig[platform];
            const Icon = platform === 'copy' && copied ? Check : config.icon;
            const label = platform === 'copy' && copied ? 'Copied!' : config.label;

            return (
              <button
                key={platform}
                onClick={() => handleShare(platform)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm',
                  'text-foreground transition-colors hover:bg-accent',
                  'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                )}
                aria-label={config.label}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
