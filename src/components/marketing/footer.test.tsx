import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SITE_CONFIG } from '@/config/site-config';

// next/image renders a plain <img> in tests.
vi.mock('next/image', () => ({
  // eslint-disable-next-line next/no-img-element -- plain <img> is fine in a jsdom test mock
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// eslint-disable-next-line import/first -- keep import order stable with the mock above
import { MarketingFooter } from './footer';

describe('MarketingFooter', () => {
  it('renders the brand name, tagline, and support email from site-config', () => {
    render(<MarketingFooter />);

    expect(screen.getByText(SITE_CONFIG.brand.name)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONFIG.brand.tagline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      `mailto:${SITE_CONFIG.brand.supportEmail}`,
    );
  });

  it('links the legal pages', () => {
    render(<MarketingFooter />);

    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });
});
