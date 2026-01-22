import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { SocialAuthButtons } from './social-auth-buttons';

const messages = {
  SocialAuth: {
    continue_with_google: 'Continue with Google',
    continue_with_github: 'Continue with GitHub',
  },
};

function renderWithIntl(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
}

describe('socialAuthButtons', () => {
  it('renders both Google and GitHub buttons', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
      />,
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('calls onGoogleClick when Google button is clicked', async () => {
    const user = userEvent.setup();
    const mockGoogleClick = vi.fn().mockResolvedValue(undefined);
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
      />,
    );

    const googleButton = screen.getByText('Continue with Google');
    await user.click(googleButton);

    expect(mockGoogleClick).toHaveBeenCalledTimes(1);
    expect(mockGitHubClick).not.toHaveBeenCalled();
  });

  it('calls onGitHubClick when GitHub button is clicked', async () => {
    const user = userEvent.setup();
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
      />,
    );

    const githubButton = screen.getByText('Continue with GitHub');
    await user.click(githubButton);

    expect(mockGitHubClick).toHaveBeenCalledTimes(1);
    expect(mockGoogleClick).not.toHaveBeenCalled();
  });

  it('disables both buttons when loading is true', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
        loading={true}
      />,
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    const githubButton = screen.getByText('Continue with GitHub').closest('button');

    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it('disables both buttons when disabled is true', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
        disabled={true}
      />,
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    const githubButton = screen.getByText('Continue with GitHub').closest('button');

    expect(googleButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
  });

  it('shows loading spinner when loading is true', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    const { container } = renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
        loading={true}
      />,
    );

    // Check for spinner animation class
    const spinners = container.querySelectorAll('.animate-spin');

    expect(spinners.length).toBeGreaterThan(0);
  });

  it('renders Google icon when not loading', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    const { container } = renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
        loading={false}
      />,
    );

    // Check for Google SVG icon (has multiple paths with fill colors)
    const googleIcon = container.querySelector('svg g path[fill="#4285F4"]');

    expect(googleIcon).toBeInTheDocument();
  });

  it('renders GitHub icon when not loading', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
        loading={false}
      />,
    );

    // Lucide Github icon should be present
    // Check for presence by finding the button and checking it has an svg
    const githubButton = screen.getByText('Continue with GitHub').closest('button');
    const svg = githubButton?.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('uses grid layout for responsive design', () => {
    const mockGoogleClick = vi.fn();
    const mockGitHubClick = vi.fn();

    renderWithIntl(
      <SocialAuthButtons
        onGoogleClick={mockGoogleClick}
        onGitHubClick={mockGitHubClick}
      />,
    );

    const googleButton = screen.getByText('Continue with Google').closest('button');
    const gridContainer = googleButton?.parentElement;

    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2');
  });
});
