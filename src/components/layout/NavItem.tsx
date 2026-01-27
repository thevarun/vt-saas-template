'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import {
  Tooltip,
  TooltipContent,
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
        // AC #3: Active state styling - Exact MagicPatterns style: white bg, blue text, shadow, ring
        isActive && 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700',
        // AC #5: Hover state for non-active items - MagicPatterns style
        !isActive && 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        // AC #4: Disabled state styling
        disabled && 'cursor-not-allowed opacity-60',
        // Collapsed: center icon
        collapsed && 'justify-center px-2',
      )}
      // AC #9: ARIA accessibility
      // Fix #8: Removed role="listitem" - the parent <li> already has implicit listitem role
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon - size-5 (20px) per MagicPatterns, no container background */}
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  // AC #7: Show tooltip when collapsed
  // Fix #7: Removed redundant TooltipProvider - parent provides it
  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
}
