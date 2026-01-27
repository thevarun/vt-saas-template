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
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        // AC #3: Active state styling - MagicPatterns blue accent style
        isActive && 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
        // AC #5: Hover state for non-active items
        !isActive && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        // AC #4: Disabled state styling
        disabled && 'cursor-not-allowed opacity-60',
        // Collapsed: center icon
        collapsed && 'justify-center px-2',
      )}
      // AC #9: ARIA accessibility
      aria-current={isActive ? 'page' : undefined}
      role="listitem"
    >
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/50'
            : 'bg-slate-100 dark:bg-slate-800',
        )}
      >
        <Icon className="size-4 shrink-0" />
      </div>
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
