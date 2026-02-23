import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from '../spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('svg');

    expect(spinner).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-primary" />);
    const spinner = container.querySelector('svg');

    expect(spinner).toHaveClass('text-primary');
  });

  it('renders an SVG element', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('svg');

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });
});
