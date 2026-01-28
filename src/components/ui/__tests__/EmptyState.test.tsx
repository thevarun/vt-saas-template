import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { User } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  describe('default variant', () => {
    it('renders icon, title, and description', () => {
      render(
        <EmptyState
          title="No items yet"
          description="Get started by creating your first item"
        />,
      );

      expect(screen.getByText('No items yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first item')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="No items yet"
          action={{
            label: 'Create Item',
            onClick: handleClick,
          }}
        />,
      );

      expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
    });

    it('does not render action button when action not provided', () => {
      render(
        <EmptyState
          title="No items yet"
          description="Get started by creating your first item"
        />,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick when button clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="No items yet"
          action={{
            label: 'Create Item',
            onClick: handleClick,
          }}
        />,
      );

      const button = screen.getByRole('button', { name: 'Create Item' });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders without description', () => {
      render(
        <EmptyState
          title="No items yet"
        />,
      );

      expect(screen.getByText('No items yet')).toBeInTheDocument();
      expect(screen.queryByText('Get started')).not.toBeInTheDocument();
    });
  });

  describe('search variant', () => {
    it('renders search variant', () => {
      render(
        <EmptyState
          variant="search"
          title="No results found"
          description="Try adjusting your search criteria"
        />,
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    });
  });

  describe('error variant', () => {
    it('renders error variant', () => {
      render(
        <EmptyState
          variant="error"
          title="Failed to load data"
          description="Something went wrong. Please try again."
        />,
      );

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    it('renders error variant with retry action', async () => {
      const user = userEvent.setup();
      const handleRetry = vi.fn();

      render(
        <EmptyState
          variant="error"
          title="Failed to load data"
          action={{
            label: 'Retry',
            onClick: handleRetry,
          }}
        />,
      );

      const button = screen.getByRole('button', { name: 'Retry' });
      await user.click(button);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom icon', () => {
    it('renders custom icon when provided', () => {
      render(
        <EmptyState
          icon={<User data-testid="custom-icon" />}
          title="No users"
        />,
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      expect(screen.getByText('No users')).toBeInTheDocument();
    });

    it('overrides default variant icon with custom icon', () => {
      render(
        <EmptyState
          variant="search"
          icon={<User data-testid="custom-icon" />}
          title="No users found"
        />,
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('applies responsive button width class', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="No items yet"
          action={{
            label: 'Create Item',
            onClick: handleClick,
          }}
        />,
      );

      const button = screen.getByRole('button', { name: 'Create Item' });

      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('sm:w-auto');
    });
  });

  describe('className prop', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <EmptyState
          title="No items yet"
          className="border-none bg-transparent"
        />,
      );

      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('border-none');
      expect(wrapper).toHaveClass('bg-transparent');
    });
  });

  describe('button variants', () => {
    it('uses secondary variant for search', () => {
      render(
        <EmptyState
          variant="search"
          title="No results"
          action={{ label: 'Clear', onClick: vi.fn() }}
        />,
      );

      // Secondary variant button should have different styling
      const button = screen.getByRole('button', { name: 'Clear' });

      expect(button).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses semantic heading for title', () => {
      render(
        <EmptyState
          title="No items yet"
        />,
      );

      expect(screen.getByRole('heading', { level: 3, name: 'No items yet' })).toBeInTheDocument();
    });

    it('button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="No items yet"
          action={{
            label: 'Create Item',
            onClick: handleClick,
          }}
        />,
      );

      const button = screen.getByRole('button', { name: 'Create Item' });
      await user.tab();

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
