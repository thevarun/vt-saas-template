import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  describe('rendering', () => {
    it('renders with default variant', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton.tagName).toBe('DIV');
    });

    it('renders with text variant', () => {
      const { container } = render(<Skeleton variant="text" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('rounded');
    });

    it('renders with card variant', () => {
      const { container } = render(<Skeleton variant="card" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-32');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('renders with avatar variant', () => {
      const { container } = render(<Skeleton variant="avatar" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveClass('size-10');
    });

    it('renders with button variant', () => {
      const { container } = render(<Skeleton variant="button" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-24');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('renders with table-row variant', () => {
      const { container } = render(<Skeleton variant="table-row" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('w-full');
    });
  });

  describe('styling', () => {
    it('has animation class', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('has background color classes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('bg-muted/50');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Skeleton className="size-20" />,
      );
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('size-20');
    });

    it('overrides variant styles with className', () => {
      const { container } = render(
        <Skeleton variant="text" className="h-8 w-1/2" />,
      );
      const skeleton = container.firstChild as HTMLElement;

      // Custom classes should be present
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('w-1/2');
    });
  });

  describe('HTML attributes', () => {
    it('accepts and applies HTML attributes', () => {
      const { container } = render(
        <Skeleton data-testid="skeleton-element" aria-label="Loading" />,
      );
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveAttribute('data-testid', 'skeleton-element');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('composition', () => {
    it('renders multiple skeletons together', () => {
      const { container } = render(
        <div>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>,
      );

      const skeletons = container.querySelectorAll('.animate-pulse');

      expect(skeletons).toHaveLength(3);
    });

    it('renders in complex layouts', () => {
      const { container } = render(
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton variant="avatar" className="size-12" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-4 w-3/4" />
              <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
          </div>
        </div>,
      );

      const skeletons = container.querySelectorAll('.animate-pulse');

      expect(skeletons).toHaveLength(3);
    });
  });
});
