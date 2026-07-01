'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';

import { ALL_THEME_IDS, isDarkTheme } from './theme-config';

/**
 * Keeps the `.dark` class on <html> in sync with the resolved theme so
 * Tailwind's `dark:` variant works for EVERY dark theme in the registry, not
 * just the built-in `dark`. next-themes only toggles `.dark` for its own
 * `dark`/`system` handling, so custom `*-dark` themes need this bridge.
 */
function DarkClassSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) {
      return;
    }
    const html = document.documentElement;
    if (isDarkTheme(resolvedTheme)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [resolvedTheme]);

  return null;
}

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Theme Provider Component
 * Wraps next-themes for app-wide theming. Extends the base light/dark setup
 * with the named themes from the registry (`ALL_THEME_IDS`) while preserving
 * `system` support and the default light/dark behavior.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...ALL_THEME_IDS, 'system']}
      disableTransitionOnChange
      {...props}
    >
      <DarkClassSync />
      {children}
    </NextThemesProvider>
  );
}
