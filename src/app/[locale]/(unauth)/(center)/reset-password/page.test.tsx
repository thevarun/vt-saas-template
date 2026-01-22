import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/locales/en.json';

import ResetPasswordPage from './page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ locale: 'en' }),
}));

// Mock Supabase client
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();
vi.mock('@/libs/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Helper to wrap component with NextIntlClientProvider
const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('reset password page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading state initially', () => {
    // Mock loading state - never resolving promise
    mockGetSession.mockReturnValue(new Promise(() => {}));

    renderWithIntl(<ResetPasswordPage />);

    expect(screen.getByText(/verifying reset link/i)).toBeInTheDocument();
  });

  it('renders the form when token is valid', async () => {
    // Mock valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { aud: 'recovery' },
        },
      },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    // Wait for form to appear
    const passwordLabel = await screen.findByLabelText(/new password/i, {}, { timeout: 1000 });

    expect(passwordLabel).toBeInTheDocument();
  });

  it('renders password requirement hint', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { aud: 'recovery' },
        },
      },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    // MagicPatterns design uses hint text instead of requirements list
    const hint = await screen.findByText(/must be at least 8 characters/i, {}, { timeout: 1000 });

    expect(hint).toBeInTheDocument();
  });

  it('renders invalid state when session is missing', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    // Updated translation: "Invalid Link" instead of "Invalid Reset Link"
    const invalidTitle = await screen.findByText(/invalid link/i, {}, { timeout: 1000 });

    expect(invalidTitle).toBeInTheDocument();
  });

  it('renders invalid state when session audience is not recovery', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { aud: 'authenticated' },
        },
      },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    // Updated translation: "Invalid Link" instead of "Invalid Reset Link"
    const invalidTitle = await screen.findByText(/invalid link/i, {}, { timeout: 1000 });

    expect(invalidTitle).toBeInTheDocument();
  });

  it('renders expired state when token error contains expired', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Token expired' },
    });

    renderWithIntl(<ResetPasswordPage />);

    // Updated translation: "Link Expired" instead of "Reset Link Expired"
    const expiredTitle = await screen.findByText(/link expired/i, {}, { timeout: 1000 });

    expect(expiredTitle).toBeInTheDocument();
  });

  it('provides link to forgot-password page from error state', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    const link = await screen.findByRole('link', { name: /request a new reset link/i }, { timeout: 1000 });

    expect(link).toHaveAttribute('href', '/en/forgot-password');
  });

  it('renders back to home link on form', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { aud: 'recovery' },
        },
      },
      error: null,
    });

    renderWithIntl(<ResetPasswordPage />);

    const backLink = await screen.findByRole('link', { name: /back to home/i }, { timeout: 1000 });

    expect(backLink).toHaveAttribute('href', '/en');
  });

  describe('password validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { aud: 'recovery' },
          },
        },
        error: null,
      });
    });

    it('validates minimum password length', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Short1');
      await user.type(confirmInput, 'Short1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('validates uppercase letter requirement', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);

      await user.type(passwordInput, 'lowercase123');
      await user.type(confirmInput, 'lowercase123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('validates lowercase letter requirement', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);

      await user.type(passwordInput, 'UPPERCASE123');
      await user.type(confirmInput, 'UPPERCASE123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument();
      });
    });

    it('validates number requirement', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);

      await user.type(passwordInput, 'NoNumbers');
      await user.type(confirmInput, 'NoNumbers');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('validates password mismatch', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'DifferentPass123');
      await user.tab();

      await waitFor(() => {
        // Updated translation: "Passwords do not match" instead of "Passwords don't match"
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('password update flow', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { aud: 'recovery' },
          },
        },
        error: null,
      });
    });

    it('successfully updates password and shows success state', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);
      const submitButton = await screen.findByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword123' });
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Password Reset',
          description: 'Your password has been successfully updated. You can now sign in with your new password.',
        });
      });

      // Updated: Success title is now "Password Reset" (from MagicPatterns design)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /password reset/i })).toBeInTheDocument();
      });

      // Verify "Back to Sign In" button exists
      expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/en/sign-in');
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockImplementation(() => new Promise(() => {}));

      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);
      const submitButton = await screen.findByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resetting.../i)).toBeInTheDocument();
      });
    });

    it('handles password update error', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed' } });

      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);
      const submitButton = await screen.findByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Password Reset Failed',
          description: 'Failed to reset password. Please try again.',
          variant: 'destructive',
        });
      });

      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('handles network error during update', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockRejectedValue(new Error('Network error'));

      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);
      const submitButton = await screen.findByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmInput, 'NewPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Password Reset Failed',
          description: 'Failed to reset password. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('renders success state with updated message', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      renderWithIntl(<ResetPasswordPage />);

      const passwordInput = await screen.findByLabelText(/new password/i);
      const confirmInput = await screen.findByLabelText(/confirm password/i);
      const submitButton = await screen.findByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123');
      await user.type(confirmInput, 'NewPassword123');
      await user.click(submitButton);

      // Updated: Success message now matches MagicPatterns
      await waitFor(() => {
        expect(screen.getByText(/your password has been successfully updated/i)).toBeInTheDocument();
      });
    });
  });
});
