import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminSidebar } from '../AdminSidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/users',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('AdminSidebar', () => {
  describe('rendering', () => {
    it('renders all navigation groups', () => {
      render(<AdminSidebar />);

      // Check group labels
      expect(screen.getByText('nav.overview')).toBeInTheDocument();
      expect(screen.getByText('nav.management')).toBeInTheDocument();
      expect(screen.getByText('nav.system')).toBeInTheDocument();
    });

    it('renders all navigation items', () => {
      render(<AdminSidebar />);

      // Check nav items
      expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
      expect(screen.getByText('nav.users')).toBeInTheDocument();
      expect(screen.getByText('nav.feedback')).toBeInTheDocument();
      expect(screen.getByText('nav.settings')).toBeInTheDocument();
    });

    it('renders brand logo', () => {
      render(<AdminSidebar />);

      expect(screen.getByText('brand')).toBeInTheDocument();
    });

    it('renders with data-testid', () => {
      render(<AdminSidebar />);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('highlights active nav item (users route)', () => {
      render(<AdminSidebar />);

      const usersLink = screen.getByText('nav.users').closest('a');

      expect(usersLink).toHaveClass('bg-slate-700', 'text-white');
    });

    it('sets aria-current on active item', () => {
      render(<AdminSidebar />);

      const usersLink = screen.getByText('nav.users').closest('a');

      expect(usersLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not highlight inactive nav items', () => {
      render(<AdminSidebar />);

      const dashboardLink = screen.getByText('nav.dashboard').closest('a');

      expect(dashboardLink).not.toHaveClass('bg-slate-700');
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('collapsed state', () => {
    it('has expanded width by default', () => {
      render(<AdminSidebar />);

      const sidebar = screen.getByTestId('admin-sidebar');

      expect(sidebar).toHaveClass('w-60');
    });

    it('has collapsed width when collapsed prop is true', () => {
      render(<AdminSidebar collapsed />);

      const sidebar = screen.getByTestId('admin-sidebar');

      expect(sidebar).toHaveClass('w-16');
    });

    it('hides labels when collapsed', () => {
      render(<AdminSidebar collapsed />);

      // Group labels should not be visible
      expect(screen.queryByText('nav.overview')).not.toBeInTheDocument();
      // Brand text should not be visible
      expect(screen.queryByText('brand')).not.toBeInTheDocument();
    });

    it('shows labels when not collapsed', () => {
      render(<AdminSidebar collapsed={false} />);

      expect(screen.getByText('nav.overview')).toBeInTheDocument();
      expect(screen.getByText('brand')).toBeInTheDocument();
    });
  });

  describe('mobile mode', () => {
    it('shows full width in mobile mode even if collapsed prop is true', () => {
      render(<AdminSidebar mobile collapsed />);

      const sidebar = screen.getByTestId('admin-sidebar');

      expect(sidebar).toHaveClass('w-60');
    });

    it('shows all labels in mobile mode', () => {
      render(<AdminSidebar mobile collapsed />);

      expect(screen.getByText('nav.overview')).toBeInTheDocument();
      expect(screen.getByText('brand')).toBeInTheDocument();
    });
  });

  describe('onLinkClick callback', () => {
    it('calls onLinkClick when nav item is clicked', async () => {
      const user = userEvent.setup();
      const onLinkClick = vi.fn();

      render(<AdminSidebar onLinkClick={onLinkClick} />);

      const dashboardLink = screen.getByText('nav.dashboard');
      await user.click(dashboardLink);

      expect(onLinkClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigation links', () => {
    it('has correct href for dashboard', () => {
      render(<AdminSidebar />);

      const dashboardLink = screen.getByText('nav.dashboard').closest('a');

      expect(dashboardLink).toHaveAttribute('href', '/admin');
    });

    it('has correct href for users', () => {
      render(<AdminSidebar />);

      const usersLink = screen.getByText('nav.users').closest('a');

      expect(usersLink).toHaveAttribute('href', '/admin/users');
    });

    it('has correct href for feedback', () => {
      render(<AdminSidebar />);

      const feedbackLink = screen.getByText('nav.feedback').closest('a');

      expect(feedbackLink).toHaveAttribute('href', '/admin/feedback');
    });

    it('has correct href for settings', () => {
      render(<AdminSidebar />);

      const settingsLink = screen.getByText('nav.settings').closest('a');

      expect(settingsLink).toHaveAttribute('href', '/admin/settings');
    });
  });

  describe('accessibility', () => {
    it('has navigation role', () => {
      render(<AdminSidebar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has aria-label for navigation', () => {
      render(<AdminSidebar />);

      const nav = screen.getByRole('navigation');

      expect(nav).toHaveAttribute('aria-label', 'Admin navigation');
    });
  });

  describe('styling', () => {
    it('has dark background', () => {
      render(<AdminSidebar />);

      const sidebar = screen.getByTestId('admin-sidebar');

      expect(sidebar).toHaveClass('bg-slate-800');
      expect(sidebar).toHaveClass('dark:bg-black');
    });

    it('has transition classes', () => {
      render(<AdminSidebar />);

      const sidebar = screen.getByTestId('admin-sidebar');

      expect(sidebar).toHaveClass('transition-all', 'duration-200');
    });
  });
});
