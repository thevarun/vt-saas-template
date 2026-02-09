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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  /** Visual variant */
  variant?: 'inline' | 'popup' | 'minimal';
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
  variant = 'inline',
  className = '',
}: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copied]);

  const handleShare = async (platform: Platform) => {
    // TODO: Analytics — event: "share_clicked", properties: { platform, url, page: window.location.pathname }

    // Native Web Share API for mobile (all platforms except 'copy')
    if (platform !== 'copy' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to platform URL
      }
    }

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      return;
    }

    const shareUrl = platformConfig[platform].getUrl(url, title);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handlePopoverOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // TODO: Analytics — event: "share_menu_opened", properties: { variant, page: window.location.pathname }
    }
  };

  const buttonBase = cn(
    'relative flex items-center justify-center transition-colors duration-200',
    'rounded-lg font-medium',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-ring focus-visible:ring-offset-background',
    'active:scale-95',
  );

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {platforms.map((platform) => {
          const config = platformConfig[platform];
          const Icon = platform === 'copy' && copied ? Check : config.icon;
          const label = platform === 'copy' && copied ? 'Copied!' : config.label;

          return (
            <Button
              key={platform}
              onClick={() => handleShare(platform)}
              variant="outline"
              size="sm"
              className={cn(
                buttonBase,
                'min-h-[44px] min-w-[44px] gap-2',
                config.hoverClass,
              )}
              aria-label={`Share on ${config.label}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="text-sm">{label}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', className)}>
          {platforms.map((platform) => {
            const config = platformConfig[platform];
            const Icon = platform === 'copy' && copied ? Check : config.icon;
            const tooltipText
              = platform === 'copy' && copied
                ? 'Link copied!'
                : `Share on ${config.label}`;

            return (
              <Tooltip key={platform}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleShare(platform)}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      buttonBase,
                      'min-h-[44px] min-w-[44px] p-2.5',
                      'text-muted-foreground',
                      config.hoverClass,
                    )}
                    aria-label={tooltipText}
                  >
                    <Icon className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Popup variant
  return (
    <Popover open={isOpen} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            buttonBase,
            'min-h-[44px] min-w-[44px]',
            className,
          )}
          aria-label="Share"
        >
          <Share2 className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[180px] p-2">
        <div className="flex flex-col gap-1">
          {platforms.map((platform) => {
            const config = platformConfig[platform];
            const Icon = platform === 'copy' && copied ? Check : config.icon;
            const label = platform === 'copy' && copied ? 'Copied!' : config.label;

            return (
              <Button
                key={platform}
                onClick={() => {
                  handleShare(platform);
                  if (platform !== 'copy') {
                    setIsOpen(false);
                  }
                }}
                variant="ghost"
                className={cn(
                  buttonBase,
                  'min-h-[44px] w-full justify-start gap-3',
                  config.hoverClass,
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
