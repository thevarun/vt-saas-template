import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SITE_CONFIG } from '@/config/site-config';
import messages from '@/locales/en.json';

// next/image renders a plain <img> in tests.
vi.mock('next/image', () => ({
  // eslint-disable-next-line next/no-img-element -- plain <img> is fine in a jsdom test mock
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// getTranslations resolves keys from the real en.json MarketingChrome namespace.
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => {
    const dict: Record<string, string>
      = namespace === 'MarketingChrome' ? messages.MarketingChrome : {};
    return (key: string, values?: Record<string, string>) => {
      let out = dict[key] ?? `${namespace}.${key}`;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          out = out.replaceAll(`{${k}}`, String(v));
        }
      }
      return out;
    };
  },
}));

// eslint-disable-next-line import/first -- keep import order stable with the mocks above
import { MarketingFooter } from './footer';

// The footer is an async server component — await its returned element.
async function renderFooter() {
  return render(await MarketingFooter());
}

describe('MarketingFooter', () => {
  it('renders the brand name, tagline, and support email from site-config', async () => {
    await renderFooter();

    expect(screen.getByText(SITE_CONFIG.brand.name)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONFIG.brand.tagline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      `mailto:${SITE_CONFIG.brand.supportEmail}`,
    );
  });

  it('links the legal pages', async () => {
    await renderFooter();

    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });
});
