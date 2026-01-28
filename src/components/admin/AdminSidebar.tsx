'use client';

import {
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/Helpers';

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

type AdminSidebarProps = {
  /** Whether the sidebar is collapsed (icons only) */
  collapsed?: boolean;
  /** Whether this is the mobile version */
  mobile?: boolean;
  /** Callback when a link is clicked (for closing mobile sheet) */
  onLinkClick?: () => void;
};

/**
 * AdminSidebar Component
 * Navigation sidebar for the admin panel with grouped nav items
 *
 * Features:
 * - Grouped navigation (Overview, Management, System)
 * - Active state highlighting
 * - Collapsed/expanded modes
 * - Dark sidebar background
 */
export function AdminSidebar({ collapsed = false, mobile = false, onLinkClick }: AdminSidebarProps) {
  const t = useTranslations('Admin');
  const pathname = usePathname();

  // Navigation groups configuration
  const navGroups: NavGroup[] = [
    {
      group: t('nav.overview'),
      items: [
        { label: t('nav.dashboard'), href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      group: t('nav.management'),
      items: [
        { label: t('nav.users'), href: '/admin/users', icon: Users },
        { label: t('nav.feedback'), href: '/admin/feedback', icon: MessageSquareText },
      ],
    },
    {
      group: t('nav.system'),
      items: [
        { label: t('nav.settings'), href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  // Determine if a nav item is active
  const isActive = (href: string) => {
    // Remove locale prefix for matching (e.g., /en/admin -> /admin)
    const cleanPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

    // Exact match for dashboard
    if (href === '/admin') {
      return cleanPath === '/admin' || cleanPath === '/admin/';
    }

    // Prefix match for other routes
    return cleanPath.startsWith(href);
  };

  // Calculate width based on collapsed state (not for mobile)
  const sidebarWidth = !mobile && collapsed ? 'w-16' : 'w-60';

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'bg-slate-800 dark:bg-black',
        'transition-all duration-200',
        sidebarWidth,
      )}
      data-testid="admin-sidebar"
    >
      {/* Logo/Brand area */}
      <div className="flex h-16 items-center border-b border-slate-700 px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Shield className="size-4 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <span className="text-lg font-semibold text-white">
              {t('brand')}
            </span>
          )}
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto p-2" role="navigation" aria-label="Admin navigation">
        {navGroups.map((group, groupIndex) => (
          <div key={group.group} className="py-2">
            {groupIndex > 0 && (
              <Separator className="my-2 bg-slate-700" />
            )}

            {/* Group label - hidden when collapsed */}
            {(!collapsed || mobile) && (
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
            )}

            {/* Nav items */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                        'transition-colors duration-150',
                        active
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                        collapsed && !mobile && 'justify-center px-2',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="size-5 shrink-0" />
                      {(!collapsed || mobile) && (
                        <span>{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
