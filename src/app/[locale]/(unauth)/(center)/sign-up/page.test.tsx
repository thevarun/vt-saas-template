import type { AuthError } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/locales/en.json';

import SignUpPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

// Mock Supabase client
const mockSignUp = vi.fn();
vi.mock('@/libs/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

// Helper to wrap component with NextIntlClientProvider
const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('signUpPage', () => {
  beforeEach(() => {
    mockSignUp.mockClear();
  });

  it('renders the sign up form', () => {
    renderWithIntl(<SignUpPage />);

    expect(screen.getByText(/create your account to get started/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    renderWithIntl(<SignUpPage />);

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one number/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignUpPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger onBlur

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignUpPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Short1');
    await user.tab(); // Trigger onBlur

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password contains uppercase letter', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignUpPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'lowercase1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
  });

  it('validates password contains lowercase letter', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignUpPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'UPPERCASE1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one lowercase letter/i)).toBeInTheDocument();
    });
  });

  it('validates password contains number', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SignUpPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'NoNumbers');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument();
    });
  });

  it('successfully creates account and redirects to verify-email', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: { user: { email: 'test@example.com' } }, error: null });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '', origin: 'http://localhost:3000' };

    renderWithIntl(<SignUpPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    // Fill in valid data and blur to trigger validation
    await user.type(emailInput, 'test@example.com');
    await user.click(passwordInput); // Focus password to blur email
    await user.type(passwordInput, 'Password123');
    await user.tab(); // Blur password field

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Wait for redirect
    await waitFor(
      () => {
        expect(window.location.href).toContain('/verify-email');
        expect(window.location.href).toContain('email=test%40example.com');
      },
      { timeout: 1000 },
    );

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123',
      options: {
        emailRedirectTo: expect.stringContaining('/api/auth/verify-complete'),
      },
    });
  });

  it('shows error message for already registered email', async () => {
    const user = userEvent.setup();
    const error: Partial<AuthError> = {
      message: 'User already registered',
      status: 400,
    };
    mockSignUp.mockResolvedValue({ data: null, error });

    renderWithIntl(<SignUpPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'existing@example.com');
    await user.click(passwordInput);
    await user.type(passwordInput, 'Password123');
    await user.tab();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    expect(screen.getByRole('link', { name: /go to sign in instead/i })).toBeInTheDocument();
  });

  it('shows error message for generic errors', async () => {
    const user = userEvent.setup();
    const error: Partial<AuthError> = {
      message: 'Something went wrong',
      status: 500,
    };
    mockSignUp.mockResolvedValue({ data: null, error });

    renderWithIntl(<SignUpPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.click(passwordInput);
    await user.type(passwordInput, 'Password123');
    await user.tab();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('disables submit button when form is invalid', async () => {
    renderWithIntl(<SignUpPage />);

    const submitButton = screen.getByRole('button', { name: /create account/i });

    expect(submitButton).toBeDisabled();
  });

  it('has link to sign in page', () => {
    renderWithIntl(<SignUpPage />);

    const signInLink = screen.getByRole('link', { name: /^sign in$/i });

    expect(signInLink).toHaveAttribute('href', '/en/sign-in');
  });

  it('has link to home page', () => {
    renderWithIntl(<SignUpPage />);

    const homeLink = screen.getByRole('link', { name: /back to home/i });

    expect(homeLink).toHaveAttribute('href', '/en');
  });
});
