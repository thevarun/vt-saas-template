'use client';

import { Home, Menu, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ThemeToggle } from '@/components/theme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AdminHeaderProps = {
  /** Callback when mobile menu button is clicked */
  onMenuClick: () => void;
  /** Callback when desktop sidebar toggle is clicked */
  onSidebarToggle?: () => void;
  /** Whether the desktop sidebar is collapsed */
  sidebarCollapsed?: boolean;
};

/**
 * AdminHeader Component
 * Top header bar for the admin panel
 *
 * Features:
 * - Admin Panel title with badge
 * - Back to App link
 * - Theme toggle
 * - Mobile menu button
 * - Desktop sidebar toggle
 */
export function AdminHeader({
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed,
}: AdminHeaderProps) {
  const t = useTranslations('Admin');

  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6"
      data-testid="admin-header"
    >
      {/* Left side: Menu toggle + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Desktop sidebar toggle */}
        {onSidebarToggle && (
          <Button
            variant="outline"
            size="icon"
            onClick={onSidebarToggle}
            className="hidden md:flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            <PanelLeft className="size-4" />
          </Button>
        )}

        {/* Title with badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t('title')}</h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {t('badge')}
          </Badge>
        </div>
      </div>

      {/* Right side: Back to App + Theme toggle */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="size-4" />
            <span className="hidden sm:inline">{t('backToApp')}</span>
          </Button>
        </Link>

        <ThemeToggle compact />
      </div>
    </header>
  );
}
