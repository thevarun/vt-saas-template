'use client';

import {
  ChevronLeft,
  CreditCard,
  Home,
  Menu,
  MessageSquare,
  Settings,
  User,
  UserPlus,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/theme';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { NavItem } from './NavItem';

type MainAppShellProps = {
  children: ReactNode;
};

type NavItemConfig = {
  icon: typeof Home;
  label: string;
  href: string;
  disabled?: boolean;
};

/**
 * MainAppShell Layout Component
 * Top-level navigation wrapper for authenticated routes
 *
 * Acceptance Criteria:
 * - AC #1: Main navigation sidebar visible on all logged-in routes
 * - AC #2: Navigation items include: Home/Dashboard, Chat/Threads, Pricing, Settings, Profile
 * - AC #3: Active state management - current route highlighted
 * - AC #6: Responsive behavior: Desktop persistent sidebar, mobile hamburger menu
 * - AC #7: Sidebar can be collapsed/expanded with smooth transitions
 * - AC #9: Keyboard accessible (Tab navigation, Enter to activate, Escape to close, ARIA labels)
 * - AC #12: Mobile header includes app logo/title and navigation toggle
 */
export function MainAppShell({ children }: MainAppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // AC #2: Navigation items configuration
  const navItems: NavItemConfig[] = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
    { icon: CreditCard, label: 'Pricing', href: '/pricing', disabled: true },
    { icon: Settings, label: 'Settings', href: '/settings', disabled: true },
    { icon: User, label: 'Profile', href: '/profile', disabled: true },
    { icon: UserPlus, label: 'Onboarding', href: '/onboarding' },
  ];

  // AC #3: Active state detection (handles nested routes like /chat/[threadId])
  const isActive = (href: string) => {
    // Remove locale prefix for matching (e.g., /en/dashboard -> /dashboard)
    const cleanPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return cleanPath === href || cleanPath.startsWith(`${href}/`);
  };

  // AC #7: Persist sidebar collapsed state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('main_sidebar_collapsed');
    if (stored !== null) {
      setSidebarOpen(stored === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('main_sidebar_collapsed', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  // AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // AC #9: Escape closes mobile sidebar
      if (e.key === 'Escape' && mobileSheetOpen) {
        setMobileSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [mobileSheetOpen]);

  return (
    <div className="flex h-screen">
      {/* AC #6: Mobile Sheet Overlay - MagicPatterns style */}
      <div className="md:hidden">
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-64 border-slate-200 bg-slate-50 p-0 dark:border-slate-700 dark:bg-slate-900">
            {/* Mobile logo area */}
            <div className="flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-lg font-bold text-white">V</span>
                </div>
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">VT SaaS</span>
              </div>
            </div>
            <nav
              className="flex h-[calc(100%-4rem)] flex-col p-3"
              role="navigation"
              aria-label="Main navigation"
            >
              <ul className="flex-1 space-y-1">
                {navItems.map(item => (
                  <NavItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={isActive(item.href)}
                    disabled={item.disabled}
                    collapsed={false}
                    onNavigate={() => setMobileSheetOpen(false)}
                  />
                ))}
              </ul>
              {/* Mobile theme toggle */}
              <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <ThemeToggle showLabel />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* AC #6, #7: Desktop Sidebar - Persistent, collapsible - MagicPatterns style */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 md:flex ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        aria-label="Main navigation sidebar"
      >
        {/* Logo area - MagicPatterns style */}
        <div className="flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-700">
          {sidebarOpen
            ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
                    <span className="text-lg font-bold text-white">V</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">VT SaaS</span>
                </div>
              )
            : (
                <div className="flex w-full justify-center">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
                    <span className="text-lg font-bold text-white">V</span>
                  </div>
                </div>
              )}
        </div>

        <nav className="flex-1 p-3" role="navigation" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map(item => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={isActive(item.href)}
                disabled={item.disabled}
                collapsed={!sidebarOpen}
              />
            ))}
          </ul>
        </nav>

        {/* Theme toggle and collapse button - MagicPatterns style */}
        <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-700">
          {/* Dark mode toggle */}
          {sidebarOpen
            ? (
                <ThemeToggle showLabel />
              )
            : (
                <ThemeToggle compact />
              )}

          {/* AC #7: Collapse toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="w-full justify-start text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            <ChevronLeft
              className={`size-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
            />
            {sidebarOpen && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* AC #1: Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* AC #12: Mobile header with logo and hamburger menu */}
        <header className="flex items-center gap-3 border-b bg-background p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSheetOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold">VT SaaS Template</h1>
        </header>

        {/* Content area - renders route-specific content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
