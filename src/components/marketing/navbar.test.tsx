import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SITE_CONFIG } from '@/config/site-config';

// next/image renders a plain <img> in tests.
vi.mock('next/image', () => ({
  // eslint-disable-next-line next/no-img-element -- plain <img> is fine in a jsdom test mock
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const useUserMock = vi.fn();
vi.mock('@/hooks/useUser', () => ({
  useUser: () => useUserMock(),
}));

// eslint-disable-next-line import/first -- mock must be hoisted above the import under test
import { MarketingNavbar } from './navbar';

describe('MarketingNavbar', () => {
  it('shows page-based auth links when logged out', () => {
    useUserMock.mockReturnValue({ user: null, loading: false });
    render(<MarketingNavbar />);

    expect(screen.getByText(SITE_CONFIG.brand.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getAllByRole('link', { name: 'Get started' })[0]).toHaveAttribute('href', '/sign-up');
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('shows a dashboard link when logged in', () => {
    useUserMock.mockReturnValue({ user: { id: 'u1' }, loading: false });
    render(<MarketingNavbar />);

    expect(screen.getAllByRole('link', { name: 'Dashboard' })[0]).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });
});
