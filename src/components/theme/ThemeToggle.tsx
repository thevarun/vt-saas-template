'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/Helpers';

import { isDarkTheme, THEME_GROUPS } from './theme-config';

type ThemeToggleProps = {
  /** Show label text next to icon */
  showLabel?: boolean;
  /** Compact mode - icon-only trigger button */
  compact?: boolean;
  /** Extra classes for the trigger button (e.g. to override the ghost hover) */
  className?: string;
};

/**
 * Theme Toggle Component
 * Grouped dropdown theme picker: color swatches per theme family, sun/moon
 * icons per light/dark variant, a check mark on the active theme, plus a
 * System option. Light/dark selection behaves exactly as before.
 */
export function ThemeToggle({ showLabel = false, compact = false, className }: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return placeholder with same dimensions to avoid layout shift
    return (
      <Button variant="ghost" size={compact ? 'icon' : 'sm'} disabled className={cn('opacity-0', className)}>
        <Sun className="size-4" />
        {showLabel && <span className="ml-2">Theme</span>}
      </Button>
    );
  }

  const currentIsDark = resolvedTheme ? isDarkTheme(resolvedTheme) : false;
  const TriggerIcon = currentIsDark ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={cn(!compact && 'w-full justify-start', className)}
          aria-label="Select theme"
        >
          <TriggerIcon className="size-4" />
          {showLabel && !compact && <span className="ml-2">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {THEME_GROUPS.map((group, i) => (
          <div key={group.group}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2">
              <span
                className="size-3 rounded-full border border-border/50"
                style={{ backgroundColor: group.swatch }}
              />
              {group.group}
            </DropdownMenuLabel>
            {group.themes.map(t => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {t.isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                  {t.label}
                </span>
                {theme === t.id && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Monitor className="size-3.5" />
            System
          </span>
          {theme === 'system' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
