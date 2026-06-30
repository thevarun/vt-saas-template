import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/libs/supabase/client';

import SignInFormClient from './SignInFormClient';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as any;

// Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

vi.mock('@/libs/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('SignInFormClient', () => {
  const mockPush = vi.fn();
  const mockSignInWithPassword = vi.fn();
  const mockTranslations = {
    title: 'Sign In',
    subtitle: 'Welcome back to VT SaaS Template',
    email_label: 'Email',
    email_placeholder: 'Enter your email',
    password_label: 'Password',
    password_placeholder: 'Enter your password',
    remember_me: 'Keep me signed in',
    forgot_password: 'Forgot password?',
    sign_in_button: 'Sign In',
    signing_in: 'Signing in...',
    no_account: 'Don\'t have an account?',
    sign_up_link: 'Sign up',
    or_continue_with: 'Or continue with',
    error_invalid_credentials: 'Invalid email or password. Please check your credentials and try again.',
    error_network: 'Network error. Please check your connection and try again.',
    error_too_many_requests: 'Too many sign-in attempts. Please wait a few minutes and try again.',
    validation_email_invalid: 'Invalid email address',
    validation_email_required: 'Email is required',
    validation_password_required: 'Password is required',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useParams as Mock).mockReturnValue({ locale: 'en' });
    (useRouter as Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as Mock).mockReturnValue({ get: vi.fn(() => null) });
    (useTranslations as Mock).mockReturnValue((key: string) => mockTranslations[key as keyof typeof mockTranslations] || key);
    (createClient as Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });
  });

  it('renders the sign-in form with all fields', () => {
    render(<SignInFormClient />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back to VT SaaS Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /keep me signed in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('successfully signs in with valid credentials', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
    });
  });

  it('signs in with remember me checked', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /keep me signed in/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(rememberMeCheckbox);

    // Verify localStorage was set for UI state persistence
    expect(setItemSpy).toHaveBeenCalledWith('remember_me', 'true');

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(mockPush).toHaveBeenCalled();
    });

    setItemSpy.mockRestore();
  });

  it('shows error message for invalid credentials', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'WrongPassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please check your credentials and try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100, { data: { user: { id: '123' } }, error: null })));

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100, { data: { user: { id: '123' } }, error: null })));

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('redirects to intended destination after sign-in', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn((key: string) => (key === 'redirect' ? '/dashboard/settings' : null)),
    });

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
    });
  });

  it('validates redirect URL to prevent open redirect', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    (useSearchParams as Mock).mockReturnValue({
      get: vi.fn((key: string) => (key === 'redirect' ? 'https://evil.com' : null)),
    });

    render(<SignInFormClient />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      // Should redirect to dashboard, not the external URL
      expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
    });
  });

  it('has links to sign-up and forgot-password pages', () => {
    render(<SignInFormClient />);

    const signUpLink = screen.getByText('Sign up');
    const forgotPasswordLink = screen.getByText('Forgot password?');

    expect(signUpLink).toHaveAttribute('href', '/en/sign-up');
    expect(forgotPasswordLink).toHaveAttribute('href', '/en/forgot-password');
  });

  it('persists remember me preference in localStorage', async () => {
    const user = userEvent.setup();
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    render(<SignInFormClient />);

    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /keep me signed in/i });
    await user.click(rememberMeCheckbox);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('remember_me', 'true');
  });
});
