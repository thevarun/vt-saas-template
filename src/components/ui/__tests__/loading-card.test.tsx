import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingCard } from '../loading-card';

describe('LoadingCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingCard />);
    const card = container.firstChild as HTMLElement;

    expect(card).toBeInTheDocument();
    expect(card.tagName).toBe('DIV');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingCard className="opacity-50" />);
    const card = container.firstChild as HTMLElement;

    expect(card).toBeInTheDocument();
    expect(card.className).toContain('opacity-50');
  });
});
