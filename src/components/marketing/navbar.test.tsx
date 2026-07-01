import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SITE_CONFIG } from '@/config/site-config';

// next/image renders a plain <img> in tests.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

const useUserMock = vi.fn();
vi.mock('@/hooks/useUser', () => ({
  useUser: () => useUserMock(),
}));

// The navbar CTAs open the overlay auth dialog via useAuthDialog(); spy on it.
const openSignIn = vi.fn();
const openSignUp = vi.fn();
vi.mock('@/components/marketing/auth-dialog', () => ({
  useAuthDialog: () => ({ openSignIn, openSignUp }),
}));

// LocaleSwitcher pulls in next-intl navigation context; stub it so the navbar
// tests stay focused on the shell's own behaviour.
vi.mock('@/components/LocaleSwitcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

// eslint-disable-next-line import/first -- mock must be hoisted above the import under test
import { MarketingNavbar } from './navbar';

describe('MarketingNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog-opening auth CTAs (buttons, not links) when logged out', () => {
    useUserMock.mockReturnValue({ user: null, loading: false });
    render(<MarketingNavbar />);

    expect(screen.getByText(SITE_CONFIG.brand.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Get started' })[0],
    ).toBeInTheDocument();
    // No page-based auth links anymore — CTAs are dialog triggers.
    expect(
      screen.queryByRole('link', { name: 'Log in' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('opens the sign-in dialog when Log in is clicked', async () => {
    const user = userEvent.setup();
    useUserMock.mockReturnValue({ user: null, loading: false });
    render(<MarketingNavbar />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(openSignIn).toHaveBeenCalledTimes(1);
    expect(openSignUp).not.toHaveBeenCalled();
  });

  it('opens the sign-up dialog when Get started is clicked', async () => {
    const user = userEvent.setup();
    useUserMock.mockReturnValue({ user: null, loading: false });
    render(<MarketingNavbar />);

    await user.click(
      screen.getAllByRole('button', { name: 'Get started' })[0]!,
    );

    expect(openSignUp).toHaveBeenCalledTimes(1);
  });

  it('shows a dashboard link when logged in', () => {
    useUserMock.mockReturnValue({ user: { id: 'u1' }, loading: false });
    render(<MarketingNavbar />);

    expect(
      screen.getAllByRole('link', { name: 'Dashboard' })[0],
    ).toHaveAttribute('href', '/dashboard');
    expect(
      screen.queryByRole('button', { name: 'Log in' }),
    ).not.toBeInTheDocument();
  });
});
