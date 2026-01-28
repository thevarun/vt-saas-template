import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminLayoutClient } from '../AdminLayoutClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/admin',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AdminLayoutClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Mock console.warn to suppress Radix UI Dialog accessibility warning
    // This is a known issue when using Sheet without Title/Description in test environment
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <AdminLayoutClient>
          <div data-testid="child-content">Test Content</div>
        </AdminLayoutClient>,
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders admin sidebar', () => {
      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    it('renders admin header', () => {
      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    });
  });

  describe('sidebar collapsed state', () => {
    it('reads initial state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('admin_sidebar_collapsed');
    });

    it('saves collapsed state to localStorage when toggled', async () => {
      const user = userEvent.setup();

      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      // Find and click the sidebar toggle button (desktop)
      const toggleButton = screen.getByRole('button', { name: /sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('admin_sidebar_collapsed', 'true');
      });
    });
  });

  describe('mobile menu', () => {
    it('opens mobile menu when menu button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      // Click mobile menu button
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);

      // Sheet should be open - look for close button which appears when sheet is open
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });

        expect(closeButton).toBeInTheDocument();
      });
    });

    it('closes mobile menu when escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      // Open menu
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);

      // Wait for sheet to open
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });

      // Press escape
      await user.keyboard('{Escape}');

      // Sheet should close
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('layout structure', () => {
    it('has flex layout with full height', () => {
      const { container } = render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      const layoutRoot = container.firstChild as HTMLElement;

      expect(layoutRoot).toHaveClass('flex', 'h-screen');
    });

    it('has overflow-hidden on root', () => {
      const { container } = render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      const layoutRoot = container.firstChild as HTMLElement;

      expect(layoutRoot).toHaveClass('overflow-hidden');
    });

    it('has background color classes', () => {
      const { container } = render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      const layoutRoot = container.firstChild as HTMLElement;

      expect(layoutRoot).toHaveClass('bg-slate-100', 'dark:bg-zinc-950');
    });
  });

  describe('desktop sidebar visibility', () => {
    it('sidebar is hidden on mobile', () => {
      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      // Desktop sidebar should have hidden md:flex classes
      const desktopSidebar = screen.getByTestId('admin-sidebar').parentElement;

      expect(desktopSidebar).toHaveClass('hidden', 'md:flex');
    });
  });

  describe('main content area', () => {
    it('has flex-1 to fill remaining space', () => {
      render(
        <AdminLayoutClient>
          <div data-testid="test-content">Content</div>
        </AdminLayoutClient>,
      );

      // Find the main content wrapper (parent of header and main)
      const header = screen.getByTestId('admin-header');
      const contentWrapper = header.parentElement;

      expect(contentWrapper).toHaveClass('flex-1', 'flex', 'flex-col');
    });

    it('main has overflow-y-auto for scrolling', () => {
      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      const main = screen.getByRole('main');

      expect(main).toHaveClass('overflow-y-auto');
    });

    it('main has responsive padding', () => {
      render(
        <AdminLayoutClient>
          <div>Content</div>
        </AdminLayoutClient>,
      );

      const main = screen.getByRole('main');

      expect(main).toHaveClass('p-4', 'lg:p-6');
    });
  });
});
