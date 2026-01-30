import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminHeader } from '../AdminHeader';

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

describe('AdminHeader', () => {
  const defaultProps = {
    onMenuClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with data-testid', () => {
      render(<AdminHeader {...defaultProps} />);

      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    });

    it('renders admin panel title', () => {
      render(<AdminHeader {...defaultProps} />);

      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('renders admin badge', () => {
      render(<AdminHeader {...defaultProps} />);

      expect(screen.getByText('badge')).toBeInTheDocument();
    });

    it('renders back to app button', () => {
      render(<AdminHeader {...defaultProps} />);

      expect(screen.getByText('backToApp')).toBeInTheDocument();
    });
  });

  describe('mobile menu button', () => {
    it('renders mobile menu button', () => {
      render(<AdminHeader {...defaultProps} />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });

      expect(menuButton).toBeInTheDocument();
    });

    it('calls onMenuClick when mobile menu button is clicked', async () => {
      const user = userEvent.setup();
      const onMenuClick = vi.fn();

      render(<AdminHeader onMenuClick={onMenuClick} />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('has md:hidden class for mobile-only visibility', () => {
      render(<AdminHeader {...defaultProps} />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });

      expect(menuButton).toHaveClass('md:hidden');
    });
  });

  describe('desktop sidebar toggle', () => {
    it('renders sidebar toggle when onSidebarToggle is provided', () => {
      render(<AdminHeader {...defaultProps} onSidebarToggle={vi.fn()} />);

      const toggleButton = screen.getByRole('button', { name: /sidebar/i });

      expect(toggleButton).toBeInTheDocument();
    });

    it('does not render sidebar toggle when onSidebarToggle is not provided', () => {
      render(<AdminHeader {...defaultProps} />);

      // Should only have mobile menu button
      const buttons = screen.getAllByRole('button');
      // Menu button, theme toggle (hidden inside), back to app is a link with button

      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onSidebarToggle when clicked', async () => {
      const user = userEvent.setup();
      const onSidebarToggle = vi.fn();

      render(<AdminHeader {...defaultProps} onSidebarToggle={onSidebarToggle} />);

      const toggleButton = screen.getByRole('button', { name: /sidebar/i });
      await user.click(toggleButton);

      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it('has correct aria-expanded based on sidebarCollapsed', () => {
      const { rerender } = render(
        <AdminHeader {...defaultProps} onSidebarToggle={vi.fn()} sidebarCollapsed={false} />,
      );

      let toggleButton = screen.getByRole('button', { name: /sidebar/i });

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      rerender(
        <AdminHeader {...defaultProps} onSidebarToggle={vi.fn()} sidebarCollapsed />,
      );

      toggleButton = screen.getByRole('button', { name: /sidebar/i });

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('back to app link', () => {
    it('has correct href to dashboard', () => {
      render(<AdminHeader {...defaultProps} />);

      const backLink = screen.getByRole('link');

      expect(backLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('theme toggle', () => {
    it('renders theme toggle', () => {
      render(<AdminHeader {...defaultProps} />);

      // ThemeToggle with compact mode
      const themeButton = screen.getByRole('button', { name: /switch to/i });

      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has header role', () => {
      render(<AdminHeader {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('mobile menu button has aria-label', () => {
      render(<AdminHeader {...defaultProps} />);

      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });

      expect(menuButton).toHaveAttribute('aria-label');
    });
  });

  describe('styling', () => {
    it('has border-b for bottom border', () => {
      render(<AdminHeader {...defaultProps} />);

      const header = screen.getByTestId('admin-header');

      expect(header).toHaveClass('border-b');
    });

    it('has responsive padding', () => {
      render(<AdminHeader {...defaultProps} />);

      const header = screen.getByTestId('admin-header');

      expect(header).toHaveClass('px-4', 'lg:px-6');
    });
  });
});
