'use client';

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

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
 * Desktop: sidebar is always visible (sidebar components handle their own collapse)
 * Mobile: sidebar hidden, opens as overlay Sheet via hamburger menu
 */
export function AppShell({ sidebar, children }: AppShellProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile: Sheet overlay for sidebar */}
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

      {/* Desktop: sidebar visible, collapse handled by sidebar component itself */}
      <div className="hidden shrink-0 lg:flex">
        {sidebar}
      </div>

      {/* Main content area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
