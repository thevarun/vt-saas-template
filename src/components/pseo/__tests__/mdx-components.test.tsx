/**
 * Tests for the MDX components registry used by <MDXRemote>.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mdxComponents } from '../mdx-components';

const { Cta, Callout, ComparisonTable } = mdxComponents;

describe('mdxComponents registry', () => {
  it('exports the expected component map', () => {
    expect(Object.keys(mdxComponents).sort()).toEqual(['Callout', 'ComparisonTable', 'Cta']);
  });
});

describe('Cta', () => {
  it('defaults to the sign-up page when no href is provided', () => {
    render(<Cta label="Get started" />);

    const link = screen.getByRole('link', { name: 'Get started' });

    expect(link).toHaveAttribute('href', '/sign-up');
  });

  it('uses the provided href', () => {
    render(<Cta label="See pricing" href="/pricing" />);

    const link = screen.getByRole('link', { name: 'See pricing' });

    expect(link).toHaveAttribute('href', '/pricing');
  });
});

describe('Callout', () => {
  it('renders its children', () => {
    render(<Callout>Heads up</Callout>);

    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('renders each variant', () => {
    const variants = ['info', 'warn', 'tip'] as const;

    for (const variant of variants) {
      const { unmount } = render(<Callout variant={variant}>{`note-${variant}`}</Callout>);

      expect(screen.getByText(`note-${variant}`)).toBeInTheDocument();

      unmount();
    }
  });
});

describe('ComparisonTable', () => {
  it('renders a table with its children', () => {
    render(
      <ComparisonTable>
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </ComparisonTable>,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Cell')).toBeInTheDocument();
  });
});
