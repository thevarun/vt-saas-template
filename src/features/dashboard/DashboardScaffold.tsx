import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

type DashboardScaffoldProps = {
  children: ReactNode;
};

/**
 * Shared shell for authenticated dashboard-like pages.
 * Reuses the same header/menu and constrained content width so navigation
 * between dashboard sections stays client-side and visually consistent.
 */
export function DashboardScaffold({ children }: DashboardScaffoldProps) {
  const t = useTranslations('DashboardLayout');

  const menu = [
    {
      href: '/dashboard',
      label: t('home'),
    },
    {
      href: '/chat',
      label: t('chat'),
    },
  ];

  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <DashboardHeader menu={menu} />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {children}
        </div>
      </div>
    </>
  );
}
