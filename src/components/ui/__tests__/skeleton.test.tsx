import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe('DIV');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="size-20" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('size-20');
  });

  it('passes HTML attributes through', () => {
    const { container } = render(
      <Skeleton data-testid="skeleton-element" aria-label="Loading" />,
    );
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveAttribute('data-testid', 'skeleton-element');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });
});
