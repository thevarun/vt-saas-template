'use client';

import { Check, Link, MoreHorizontal, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    label: 'X',
    icon: XIcon,
    hoverClass:
      'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  linkedin: {
    label: 'LinkedIn',
    icon: LinkedInIcon,
    hoverClass: 'hover:bg-[#0A66C2] hover:text-white',
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  facebook: {
    label: 'Facebook',
    icon: FacebookIcon,
    hoverClass: 'hover:bg-[#1877F2] hover:text-white',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  copy: {
    label: 'Copy Link',
    icon: Link,
    hoverClass: 'hover:bg-emerald-500 hover:text-white',
    getUrl: () => '',
  },
};

export function ShareWidget({
  url,
  title,
  description,
  platforms = ['twitter', 'linkedin', 'facebook', 'copy'],
  className = '',
}: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copied]);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

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
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url });
    } catch {
      // User cancelled or API failed
    }
  };

  const buttonBase = cn(
    'relative flex items-center justify-center transition-colors duration-200',
    'rounded-lg font-medium',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-ring focus-visible:ring-offset-background',
    'active:scale-95',
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(buttonBase, 'gap-2', className)}
        aria-label="Share"
      >
        <Share2 className="size-4" />
        <span className="text-sm">Share</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
            <DialogDescription className="sr-only">
              Share this page via social media or copy the link
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {platforms.map((platform) => {
              const config = platformConfig[platform];
              const Icon = platform === 'copy' && copied ? Check : config.icon;
              const label = platform === 'copy' && copied ? 'Copied!' : config.label;

              return (
                <Button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  variant="outline"
                  className={cn(
                    buttonBase,
                    'min-h-[44px] gap-2',
                    config.hoverClass,
                  )}
                  aria-label={platform === 'copy' ? 'Copy Link' : `Share on ${config.label}`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="text-sm">{label}</span>
                </Button>
              );
            })}
            {hasNativeShare && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className={cn(buttonBase, 'min-h-[44px] gap-2 col-span-2')}
                aria-label="More sharing options"
              >
                <MoreHorizontal className="size-4 shrink-0" />
                <span className="text-sm">More</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
