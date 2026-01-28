'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/libs/i18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

type LanguageSelectorProps = {
  /** Show label text next to icon */
  showLabel?: boolean;
  /** Compact mode - icon only button */
  compact?: boolean;
};

/**
 * Language Selector Component
 * Provides UI for switching between supported languages (English, Hindi, Bengali)
 * Persists preference to database via API and changes route locale
 */
export function LanguageSelector({ showLabel = false, compact = false }: LanguageSelectorProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = async (newLocale: string) => {
    // Persist to database
    // Fix #2: Only send language field - backend handles partial updates
    try {
      await fetch('/api/profile/update-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLocale }),
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    // Change route locale
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const currentLocaleConfig = AppConfig.locales.find(l => l.id === locale);

  if (!mounted) {
    return (
      <Button variant="ghost" size={compact ? 'icon' : 'sm'} disabled className="opacity-0">
        <Globe className="size-4" />
        {showLabel && <span className="ml-2">Language</span>}
      </Button>
    );
  }

  // Compact mode: just show globe icon with current locale indicator
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label="Change language"
          >
            <Globe className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {AppConfig.locales.map(localeOption => (
            <DropdownMenuItem
              key={localeOption.id}
              onClick={() => handleLanguageChange(localeOption.id)}
              className={locale === localeOption.id ? 'bg-accent' : ''}
            >
              {localeOption.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full mode: dropdown with label
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          disabled={isPending}
          aria-label="Change language"
        >
          <Globe className="size-4" />
          {showLabel && <span className="ml-2">{currentLocaleConfig?.name || 'Language'}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {AppConfig.locales.map(localeOption => (
          <DropdownMenuItem
            key={localeOption.id}
            onClick={() => handleLanguageChange(localeOption.id)}
            className={locale === localeOption.id ? 'bg-accent' : ''}
          >
            {localeOption.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
