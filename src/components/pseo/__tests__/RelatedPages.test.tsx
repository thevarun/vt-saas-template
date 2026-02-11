/**
 * Tests for RelatedPages component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PseoPage } from '@/libs/pseo/data';

import { RelatedPages } from '../RelatedPages';

describe('RelatedPages Component', () => {
  const mockPages: PseoPage[] = [
    {
      id: 'page-1',
      categoryId: 'productivity',
      slug: 'time-management',
      title: 'Time Management Tips',
      description: 'Learn effective time management strategies',
      content: 'Content here',
      keywords: ['time', 'management'],
      lastModified: '2024-02-01',
    },
    {
      id: 'page-2',
      categoryId: 'productivity',
      slug: 'focus-techniques',
      title: 'Focus Techniques',
      description: 'Improve your focus and concentration',
      content: 'Content here',
      keywords: ['focus', 'concentration'],
      lastModified: '2024-02-02',
    },
  ];

  it('should render related pages section', () => {
    render(
      <RelatedPages
        pages={mockPages}
        categorySlug="productivity"
        locale="en"
      />,
    );

    expect(screen.getByText('Related Articles')).toBeInTheDocument();
  });

  it('should render all related page cards', () => {
    render(
      <RelatedPages
        pages={mockPages}
        categorySlug="productivity"
        locale="en"
      />,
    );

    expect(screen.getByText('Time Management Tips')).toBeInTheDocument();
    expect(screen.getByText('Focus Techniques')).toBeInTheDocument();
  });

  it('should render page descriptions', () => {
    render(
      <RelatedPages
        pages={mockPages}
        categorySlug="productivity"
        locale="en"
      />,
    );

    expect(screen.getByText('Learn effective time management strategies')).toBeInTheDocument();
    expect(screen.getByText('Improve your focus and concentration')).toBeInTheDocument();
  });

  it('should make each card a link', () => {
    render(
      <RelatedPages
        pages={mockPages}
        categorySlug="productivity"
        locale="en"
      />,
    );

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/en/productivity/time-management');
    expect(links[1]).toHaveAttribute('href', '/en/productivity/focus-techniques');
  });

  it('should not render if no pages provided', () => {
    const { container } = render(
      <RelatedPages
        pages={[]}
        categorySlug="productivity"
        locale="en"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
