import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from '../spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders with default size', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('size-6');
    });

    it('renders with small size', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('size-4');
    });

    it('renders with medium size', () => {
      const { container } = render(<Spinner size="md" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('size-6');
    });

    it('renders with large size', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('size-12');
    });
  });

  describe('styling', () => {
    it('has animate-spin class', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('animate-spin');
    });

    it('has default text color', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      const { container } = render(<Spinner className="text-primary" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('text-primary');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <Spinner className="text-blue-500 opacity-50" />,
      );
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('animate-spin');
      expect(spinner).toHaveClass('text-blue-500');
      expect(spinner).toHaveClass('opacity-50');
    });
  });

  describe('size variants', () => {
    it('sm size maps to size-4', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('size-4');
    });

    it('md size maps to size-6', () => {
      const { container } = render(<Spinner size="md" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('size-6');
    });

    it('lg size maps to size-12', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('svg');

      expect(spinner).toHaveClass('size-12');
    });
  });

  describe('icon', () => {
    it('uses Loader2 icon from lucide-react', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('svg');

      expect(spinner).toBeInTheDocument();
      // Loader2 icon has specific attributes
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });
  });

  describe('composition', () => {
    it('renders inside button', () => {
      const { container } = render(
        <button type="button">
          <Spinner size="sm" className="mr-2" />
          Loading...
        </button>,
      );

      const spinner = container.querySelector('svg');
      const button = container.querySelector('button');

      expect(spinner).toBeInTheDocument();
      expect(button).toHaveTextContent('Loading...');
      expect(spinner).toHaveClass('mr-2');
    });

    it('renders multiple spinners', () => {
      const { container } = render(
        <div>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>,
      );

      const spinners = container.querySelectorAll('svg');

      expect(spinners).toHaveLength(3);
    });

    it('renders centered for full-page loading', () => {
      const { container } = render(
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>,
      );

      const spinner = container.querySelector('svg');
      const wrapper = container.querySelector('div');

      expect(spinner).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });
  });
});
