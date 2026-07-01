import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Hoisted navigation mocks (configurable per test) ---------------------
const { mockReplace, mockPush, getSearchParams, resetSearchParams }
  = vi.hoisted(() => {
    const state = { searchParams: new URLSearchParams() };
    return {
      mockReplace: vi.fn(),
      mockPush: vi.fn(),
      getSearchParams: () => state.searchParams,
      resetSearchParams: () => {
        state.searchParams = new URLSearchParams();
      },
    };
  });

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/',
  useSearchParams: () => getSearchParams(),
}));

vi.mock('next/link', () => ({

  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

vi.mock('@/libs/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

// eslint-disable-next-line import/first -- mocks must be hoisted above the import under test
import {
  AuthDialogAutoOpener,
  AuthDialogProvider,
  useAuthDialog,
} from './auth-dialog';

const messages = {
  AuthDialog: {
    signin_title: 'Sign in',
    signin_subtitle: 'Welcome back',
    signup_title: 'Create your account',
    signup_subtitle: 'Start building in minutes',
    or: 'or',
    email_label: 'Email',
    email_placeholder: 'you@example.com',
    password_label: 'Password',
    password_placeholder: 'Enter your password',
    continue_button: 'Continue',
    sign_in_button: 'Sign in',
    signing_in: 'Signing in…',
    sending: 'Sending…',
    use_password: 'Use password instead',
    use_magic_link: 'Use a magic link instead',
    forgot_password: 'Forgot password?',
    no_account: 'Don\'t have an account?',
    sign_up_link: 'Sign up',
    already_have_account: 'Already have an account?',
    sign_in_link: 'Sign in',
    error_title: 'Something went wrong',
    error_oauth: 'Could not start sign-in. Please try again.',
    error_invalid_credentials: 'Invalid email or password.',
    error_network: 'Network error. Please try again.',
    terms_text: 'By continuing you agree to our',
    terms_link: 'Terms',
    terms_and: 'and',
    privacy_link: 'Privacy Policy',
    validation_email_required: 'Email is required',
    validation_email_invalid: 'Enter a valid email',
    validation_password_required: 'Password is required',
    magic_confirmation_title: 'Check your email',
    magic_confirmation_subtitle: 'We sent you a magic link.',
    magic_error_rate_limit: 'Too many requests. Try again shortly.',
    magic_error_generic: 'Could not send the link. Please try again.',
    magic_resend_button: 'Resend email',
    magic_resend_loading: 'Sending…',
    magic_resend_success: 'Sent',
    magic_resend_cooldown: 'Resend in {seconds}s',
    magic_back_to_sign_in: 'Back',
  },
  SocialAuth: {
    google: 'Google',
    github: 'GitHub',
    continue_with_google: 'Continue with Google',
    continue_with_github: 'Continue with GitHub',
  },
};

function Consumer() {
  const { openSignIn, openSignUp } = useAuthDialog();
  return (
    <div>
      <button type="button" onClick={() => openSignIn()}>
        open-signin
      </button>
      <button type="button" onClick={() => openSignUp()}>
        open-signup
      </button>
    </div>
  );
}

function renderProvider(children?: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuthDialogProvider>
        <Consumer />
        {children}
      </AuthDialogProvider>
    </NextIntlClientProvider>,
  );
}

describe('authDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSearchParams();
  });

  it('opens the sign-in tab via useAuthDialog().openSignIn()', async () => {
    const user = userEvent.setup();
    renderProvider();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByText('open-signin'));

    expect(
      screen.getByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
    // OAuth (Google + GitHub) rendered, no LinkedIn anywhere.
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('opens the sign-up tab via openSignUp()', async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByText('open-signup'));

    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();
  });

  it('switches from sign-up to sign-in via the inline link', async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByText('open-signup'));

    expect(
      screen.getByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      screen.getByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
  });

  it('reveals the password field when toggling to password mode', async () => {
    const user = userEvent.setup();
    renderProvider();

    await user.click(screen.getByText('open-signin'));

    expect(
      screen.queryByPlaceholderText('Enter your password'),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Use password instead' }),
    );

    expect(
      screen.getByPlaceholderText('Enter your password'),
    ).toBeInTheDocument();
  });

  it('AuthDialogAutoOpener opens the dialog from ?auth=signin and strips the params', async () => {
    getSearchParams().set('auth', 'signin');
    getSearchParams().set('redirect', '/en/settings');

    renderProvider(<AuthDialogAutoOpener />);

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
    // Params are stripped so refresh/back does not re-open the dialog.
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
