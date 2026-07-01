import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// jsdom has no IntersectionObserver — Reveal needs it on mount.
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver
  = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// next/image renders a plain <img> in tests so we can assert alt/src.
vi.mock('next/image', () => ({

  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// eslint-disable-next-line import/first -- mocks must be hoisted above imports under test
import { ABOUT_CONTENT } from './about-content';
// eslint-disable-next-line import/first -- mocks must be hoisted above imports under test
import AboutPage from './page';

async function renderAbout() {
  const ui = await AboutPage({ params: Promise.resolve({ locale: 'en' }) });
  return render(ui);
}

describe('AboutPage', () => {
  it('renders the founder name and role from the content file', async () => {
    await renderAbout();

    expect(
      screen.getByRole('heading', { name: ABOUT_CONTENT.founderName }),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOUT_CONTENT.founderRole)).toBeInTheDocument();
  });

  it('renders the founder bio and quote from the content file', async () => {
    await renderAbout();

    expect(screen.getByText(ABOUT_CONTENT.bio)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_CONTENT.quote)).toBeInTheDocument();
  });

  it('wires the LinkedIn href from the content file', async () => {
    await renderAbout();

    const linkedin = ABOUT_CONTENT.socials.find(s => s.label === 'LinkedIn');

    expect(linkedin).toBeDefined();

    const link = screen.getByRole('link', { name: 'LinkedIn' });

    expect(link).toHaveAttribute('href', linkedin!.href);
  });

  it('renders the founder photo via next/image', async () => {
    await renderAbout();

    const img = screen.getByAltText(new RegExp(ABOUT_CONTENT.founderName, 'i'));

    expect(img).toHaveAttribute('src', ABOUT_CONTENT.founderImage);
  });
});
