'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/Helpers';

type NavItemProps = {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  disabled?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

/**
 * NavItem Component
 * Reusable navigation item for main app navigation
 *
 * Acceptance Criteria:
 * - AC #2: Navigation items with appropriate icons
 * - AC #3: Active state styling
 * - AC #4: Placeholder items show "Coming Soon" toast on click
 * - AC #5: Chat navigation item is functional
 * - AC #7: Supports collapsed state (icon only)
 * - AC #9: Keyboard accessible with ARIA labels
 */
export function NavItem({
  icon: Icon,
  label,
  href,
  isActive = false,
  disabled = false,
  collapsed = false,
  onNavigate,
}: NavItemProps) {
  const { toast } = useToast();

  // AC #4: Show toast for placeholder items
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      toast({
        title: 'Coming Soon',
        description: `${label} is coming soon!`,
      });
    } else if (onNavigate) {
      onNavigate();
    }
  };

  const content = (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        // AC #3: Active state styling
        isActive && 'bg-primary text-primary-foreground',
        // AC #5: Hover state for non-active items
        !isActive && 'text-muted-foreground hover:bg-muted hover:text-foreground',
        // AC #4: Disabled state styling
        disabled && 'cursor-not-allowed opacity-60',
        // Collapsed: center icon
        collapsed && 'justify-center px-2',
      )}
      // AC #9: ARIA accessibility
      aria-current={isActive ? 'page' : undefined}
      role="listitem"
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  // AC #7: Show tooltip when collapsed
  if (collapsed) {
    return (
      <li>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </li>
    );
  }

  return <li>{content}</li>;
}
