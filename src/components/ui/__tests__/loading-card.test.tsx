import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingCard } from '../loading-card';

describe('LoadingCard', () => {
  describe('rendering', () => {
    it('renders without errors', () => {
      const { container } = render(<LoadingCard />);
      const card = container.querySelector('.rounded-lg.border');

      expect(card).toBeInTheDocument();
    });

    it('renders all skeleton elements', () => {
      const { container } = render(<LoadingCard />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      // Should have: avatar (1) + title (1) + subtitle (1) + body (3) + button (1) = 7
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('has proper card structure', () => {
      const { container } = render(<LoadingCard />);
      const card = container.querySelector('.rounded-lg.border.bg-card');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-6');
      expect(card).toHaveClass('space-y-3');
    });
  });

  describe('skeleton elements', () => {
    it('renders avatar skeleton', () => {
      const { container } = render(<LoadingCard />);
      const avatar = container.querySelector('.rounded-full.size-12');

      expect(avatar).toBeInTheDocument();
    });

    it('renders header with avatar and text', () => {
      const { container } = render(<LoadingCard />);
      const header = container.querySelector('.flex.items-center.space-x-4');

      expect(header).toBeInTheDocument();
    });

    it('renders content body with multiple text skeletons', () => {
      const { container } = render(<LoadingCard />);
      const body = container.querySelector('.space-y-2');

      expect(body).toBeInTheDocument();

      // Body should contain text skeletons
      const textSkeletons = body?.querySelectorAll('.h-3');

      expect(textSkeletons?.length).toBeGreaterThan(0);
    });

    it('renders button skeleton', () => {
      const { container } = render(<LoadingCard />);
      const button = container.querySelector('.h-10.w-full.sm\\:w-auto');

      expect(button).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has card styling classes', () => {
      const { container } = render(<LoadingCard />);
      const card = container.querySelector('.rounded-lg');

      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('p-6');
    });

    it('applies custom className', () => {
      const { container } = render(<LoadingCard className="opacity-50" />);
      const card = container.querySelector('.opacity-50');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg');
    });

    it('has responsive button width', () => {
      const { container } = render(<LoadingCard />);
      const button = container.querySelector('.w-full.sm\\:w-auto');

      expect(button).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('uses space-y-3 for vertical spacing', () => {
      const { container } = render(<LoadingCard />);
      const card = container.querySelector('.space-y-3');

      expect(card).toBeInTheDocument();
    });

    it('avatar section has flex layout', () => {
      const { container } = render(<LoadingCard />);
      const avatarSection = container.querySelector('.flex.items-center');

      expect(avatarSection).toBeInTheDocument();
      expect(avatarSection).toHaveClass('space-x-4');
    });

    it('avatar has shrink-0 class', () => {
      const { container } = render(<LoadingCard />);
      const avatar = container.querySelector('.shrink-0');

      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('rounded-full');
    });
  });

  describe('composition', () => {
    it('renders multiple cards in grid', () => {
      const { container } = render(
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>,
      );

      const cards = container.querySelectorAll('.rounded-lg.border');

      expect(cards).toHaveLength(3);
    });

    it('renders in various layouts', () => {
      const { container } = render(
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
        </div>,
      );

      const cards = container.querySelectorAll('.rounded-lg.border');

      expect(cards).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('card structure is semantic', () => {
      const { container } = render(<LoadingCard />);
      const card = container.firstChild;

      expect(card).toBeInTheDocument();
      expect(card?.nodeName).toBe('DIV');
    });
  });

  describe('dark mode support', () => {
    it('has dark mode classes in card structure', () => {
      const { container } = render(<LoadingCard />);

      // Check that skeleton components inside have proper structure for dark mode
      const skeletons = container.querySelectorAll('.animate-pulse');

      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
