'use client';

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * AppShell Layout Component
 * Provides responsive layout with sidebar + main content area
 *
 * Acceptance Criteria:
 * - AC #1: AppShell layout component renders sidebar + main content area
 * - AC #7: Desktop (≥1024px): Sidebar visible by default, collapsible to icon bar
 * - AC #8: Mobile (<768px): Sidebar hidden by default, opens as overlay (Sheet) via hamburger menu
 * - AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
 */
export function AppShell({ sidebar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // AC #7: Persist sidebar collapsed state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored !== null) {
      setSidebarOpen(stored !== 'false');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  // AC #9: Keyboard shortcut (Cmd/Ctrl+Shift+B) toggles chat sidebar
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <div className="flex h-full gap-4">
      {/* AC #8: Mobile Sheet Overlay - AC #14: Fixed mobile header spacing */}
      <div className="lg:hidden">
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-3 top-3 z-40 shadow-md"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>

      {/* AC #7: Desktop Sidebar - Visible by default, collapsible */}
      <aside
        className={`hidden shrink-0 flex-col rounded-lg border bg-card shadow-sm transition-all duration-300 lg:flex ${
          sidebarOpen
            ? 'w-72'
            : 'w-16'
        }`}
      >
        {/* AC #11.5: Collapse control in sidebar header only */}
        <div className="flex h-full flex-col overflow-hidden">
          {sidebarOpen
            ? (
                sidebar
              )
            : (
                <div className="flex flex-col items-center gap-4 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Expand sidebar"
                    className="shrink-0"
                    title="Expand sidebar"
                  >
                    <Menu className="size-5" />
                  </Button>
                </div>
              )}
        </div>
      </aside>

      {/* AC #1: Main content area - AC #15: Smooth transition when sidebar collapses */}
      {/* min-h-0 required for flex child to allow overflow scrolling */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
