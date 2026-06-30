'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/Helpers';

type ThemeToggleProps = {
  /** Show label text next to icon */
  showLabel?: boolean;
  /** Compact mode - icon only button without dropdown */
  compact?: boolean;
  /** Extra classes for the trigger button (e.g. to override the ghost hover) */
  className?: string;
};

/**
 * Theme Toggle Component
 * Provides UI for switching between light, dark, and system themes
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

  // Compact mode: simple toggle between light/dark
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        className={className}
      >
        {resolvedTheme === 'dark'
          ? (
              <Sun className="size-4" />
            )
          : (
              <Moon className="size-4" />
            )}
      </Button>
    );
  }

  // Full mode: dropdown with all theme options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full justify-start', className)}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark'
            ? (
                <Moon className="size-4" />
              )
            : (
                <Sun className="size-4" />
              )}
          {showLabel && <span className="ml-2">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <span className="mr-2 size-4 text-center">💻</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
