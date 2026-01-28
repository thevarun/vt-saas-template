'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

type AdminLayoutClientProps = {
  children: ReactNode;
};

/**
 * AdminLayoutClient Component
 * Client-side wrapper for admin layout with state management
 *
 * Features:
 * - Desktop sidebar with collapse/expand
 * - Mobile sidebar as Sheet overlay
 * - Responsive breakpoints (md: 768px)
 * - Persisted sidebar state in localStorage
 */
export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist sidebar collapsed state
  const isInitialized = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin_sidebar_collapsed');
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('admin_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
    }
  }, [sidebarCollapsed]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Keyboard shortcut: Escape closes mobile menu
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex" aria-label="Admin sidebar">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onLinkClick={() => {}}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main admin navigation menu</SheetDescription>
          <AdminSidebar
            mobile
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
