import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/libs/supabase/client';

import ForgotPasswordPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Forgot password?',
      subtitle: 'No worries, we\'ll send you reset instructions.',
      email_label: 'Email address',
      email_placeholder: 'name@company.com',
      submit_button: 'Send reset link',
      sending: 'Sending...',
      back: 'Back',
      back_to_sign_in: 'Back to sign in',
      success_title: 'Check your email!',
      success_message: 'We\'ve sent a password reset link to your email address.',
      success_email_sent_to: 'Check your email! We\'ve sent a reset link to',
      try_another_email: 'Try another email',
      validation_email_invalid: 'Please enter a valid email address',
      validation_email_required: 'Email is required',
      error_rate_limit: 'Too many password reset requests. Please try again in a few minutes.',
      error_network: 'Network error. Please check your connection and try again.',
    };
    return translations[key] || key;
  },
}));

// Mock Supabase client
vi.mock('@/libs/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('ForgotPasswordPage', () => {
  const mockResetPasswordForEmail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'en' });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });
  });

  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('No worries, we\'ll send you reset instructions.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('successfully submits forgot password request', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/en/reset-password'),
        }),
      );
    });

    // Check success state is shown
    await waitFor(() => {
      expect(screen.getByText('Check your email!')).toBeInTheDocument();
      expect(screen.getByText('We\'ve sent a password reset link to your email address.')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows generic success message regardless of email existence (security)', async () => {
    const user = userEvent.setup();
    // Supabase doesn't return error for non-existent emails (by design)
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'nonexistent@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check your email!')).toBeInTheDocument();
      expect(screen.getByText('We\'ve sent a password reset link to your email address.')).toBeInTheDocument();
    });
  });

  it('handles rate limiting error', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Email rate limit exceeded' },
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Too many password reset requests. Please try again in a few minutes.')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Network error occurred' },
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();

    mockResetPasswordForEmail.mockRejectedValue(new Error('Unexpected error'));

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)),
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(screen.getByText('Sending...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Check your email!')).toBeInTheDocument();
    });
  });

  it('renders back to sign in link in form state', () => {
    render(<ForgotPasswordPage />);

    const backLinks = screen.getAllByText('Back to sign in');

    expect(backLinks.length).toBeGreaterThan(0);
    expect(backLinks[0]).toHaveAttribute('href', '/en/sign-in');
  });

  it('renders back to sign in button in success state', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      const backToSignInButton = screen.getByRole('link', { name: /back to sign in/i });

      expect(backToSignInButton).toBeInTheDocument();
      expect(backToSignInButton).toHaveAttribute('href', '/en/sign-in');
    });
  });

  it('shows try another email option in success state', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try another email/i })).toBeInTheDocument();
    });

    // Clicking "try another email" should return to form
    const tryAnotherButton = screen.getByRole('button', { name: /try another email/i });
    await user.click(tryAnotherButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });
  });

  it('clears server error on new submission', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValueOnce({
      error: { message: 'Network error' },
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });

    // Submit again with successful response
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Network error. Please check your connection and try again.')).not.toBeInTheDocument();
      expect(screen.getByText('Check your email!')).toBeInTheDocument();
    });
  });
});
