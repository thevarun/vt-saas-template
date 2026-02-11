/**
 * Tests for Breadcrumbs component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PseoCategory } from '@/libs/pseo/data';

import { Breadcrumbs } from '../Breadcrumbs';

describe('Breadcrumbs Component', () => {
  const mockCategory: PseoCategory = {
    id: 'productivity',
    name: 'Productivity',
    description: 'Productivity tips and tools',
    slug: 'productivity',
  };

  it('should render breadcrumb navigation', () => {
    render(
      <Breadcrumbs
        category={mockCategory}
        pageTitle="Time Management"
        locale="en"
      />,
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('should render all breadcrumb items', () => {
    render(
      <Breadcrumbs
        category={mockCategory}
        pageTitle="Time Management"
        locale="en"
      />,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Productivity')).toBeInTheDocument();
    expect(screen.getByText('Time Management')).toBeInTheDocument();
  });

  it('should make home and category links clickable', () => {
    render(
      <Breadcrumbs
        category={mockCategory}
        pageTitle="Time Management"
        locale="en"
      />,
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });

    expect(homeLink).toHaveAttribute('href', '/en');

    const categoryLink = screen.getByRole('link', { name: 'Productivity' });

    expect(categoryLink).toHaveAttribute('href', '/en/productivity');
  });

  it('should not make current page clickable', () => {
    render(
      <Breadcrumbs
        category={mockCategory}
        pageTitle="Time Management"
        locale="en"
      />,
    );

    // Page title should exist but not be a link
    const pageTitle = screen.getByText('Time Management');

    expect(pageTitle.tagName).not.toBe('A');
  });

  it('should render JSON-LD structured data', () => {
    const { container } = render(
      <Breadcrumbs
        category={mockCategory}
        pageTitle="Time Management"
        locale="en"
      />,
    );

    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();

    if (script) {
      const jsonLd = JSON.parse(script.textContent || '{}');

      expect(jsonLd['@type']).toBe('BreadcrumbList');
      expect(jsonLd.itemListElement).toHaveLength(3);
    }
  });
});
