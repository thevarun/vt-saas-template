'use client';

import {
  ChevronLeft,
  CreditCard,
  Home,
  Menu,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

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
      {/* AC #6: Mobile Sheet Overlay */}
      <div className="md:hidden">
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <nav
              className="flex h-full flex-col p-4"
              role="navigation"
              aria-label="Main navigation"
            >
              <ul className="space-y-1">
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* AC #6, #7: Desktop Sidebar - Persistent, collapsible */}
      <aside
        className={`hidden shrink-0 flex-col border-r bg-background transition-all duration-300 md:flex ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        aria-label="Main navigation sidebar"
      >
        <nav className="flex-1 p-2" role="navigation" aria-label="Main navigation">
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

        {/* AC #7: Collapse toggle button */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="w-full justify-start"
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
          <h1 className="text-lg font-semibold">Health Companion</h1>
        </header>

        {/* Content area - renders route-specific content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
