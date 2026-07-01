'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createContext, use, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import { fetchPostAuthDestination } from '@/libs/auth/fetch-post-auth-destination';
import { toSafeInternalPath } from '@/libs/auth/safe-path';
import { createClient } from '@/libs/supabase/client';
import {
  COOLDOWN_DURATION,
  getRemainingCooldown,
  setCooldownExpiry,
} from '@/libs/utils/auth-cooldown';
import { cn } from '@/utils/Helpers';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

type AuthTab = 'sign-in' | 'sign-up';

type AuthDialogContextValue = {
  openSignIn: (redirectPath?: string) => void;
  openSignUp: (redirectPath?: string) => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue>({
  openSignIn: () => {},
  openSignUp: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components -- file intentionally co-exports non-component helpers
export const useAuthDialog = () => use(AuthDialogContext);

/* ------------------------------------------------------------------ */
/*  Dialog                                                            */
/* ------------------------------------------------------------------ */

const COOLDOWN_PREFIX = 'magic_link_cooldown';
type ResendStatus = 'idle' | 'loading' | 'success' | 'cooldown';

// shadcn Input base styling. Applied to a raw <input> so react-hook-form's
// callback ref works — the shared <Input> component types `ref` as a
// RefObject, which is incompatible with register()'s ref.
const INPUT_CLASS
  = 'flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const AuthDialog = ({
  open,
  onOpenChange,
  tab,
  onTabChange,
  redirectPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  redirectPath: string;
}) => {
  const t = useTranslations('AuthDialog');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [oauthLoading, setOauthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when dialog closes.
  useEffect(() => {
    if (!open) {
      setMagicLinkSent(false);
      setMagicLinkEmail('');
      setSubmitting(false);
      setOauthLoading(false);
      setResendStatus('idle');
      setCooldownSeconds(0);
      setShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    setMagicLinkSent(false);
    setShowPassword(false);
  }, [tab]);

  const formSchema = z.object({
    email: z
      .string()
      .min(1, t('validation_email_required'))
      .email(t('validation_email_invalid')),
    password: showPassword
      ? z.string().min(1, t('validation_password_required'))
      : z.string().optional(),
  });
  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  });

  // Reset form when switching modes.
  useEffect(() => {
    reset();
  }, [showPassword, tab, reset]);

  // Cooldown timer.
  useEffect(() => {
    if (resendStatus === 'cooldown' && cooldownSeconds > 0) {
      const interval = setInterval(() => {
        const remaining = getRemainingCooldown(COOLDOWN_PREFIX, magicLinkEmail);
        setCooldownSeconds(remaining);
        if (remaining <= 0) {
          setResendStatus('idle');
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    if (cooldownSeconds === 0 && resendStatus === 'cooldown') {
      setResendStatus('idle');
    }
    return undefined;
  }, [resendStatus, cooldownSeconds, magicLinkEmail]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        ...(provider === 'google'
          ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
          : {}),
      },
    });
    if (error) {
      toast.error(t('error_title'), { description: t('error_oauth') });
      setOauthLoading(false);
    }
  };

  const sendMagicLink = async (emailAddress: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    });
    return { error };
  };

  const onSubmit = async (data: { email: string; password?: string }) => {
    setSubmitting(true);

    // Password sign-in.
    if (showPassword && data.password) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) {
          toast.error(t('error_title'), {
            description: t('error_invalid_credentials'),
          });
          setSubmitting(false);
          return;
        }
        onOpenChange(false);
        const destination = await fetchPostAuthDestination({
          locale,
          preferredPath: redirectPath,
        });
        router.push(destination);
      } catch {
        toast.error(t('error_title'), { description: t('error_network') });
        setSubmitting(false);
      }
      return;
    }

    // Magic link.
    try {
      const { error } = await sendMagicLink(data.email);
      if (error) {
        toast.error(t('error_title'), {
          description:
            error.message.includes('Too many requests')
            || error.message.includes('rate limit')
              ? t('magic_error_rate_limit')
              : t('magic_error_generic'),
        });
        setSubmitting(false);
        return;
      }
      setMagicLinkEmail(data.email);
      setMagicLinkSent(true);
      const expiryTime = Date.now() + COOLDOWN_DURATION * 1000;
      setCooldownExpiry(COOLDOWN_PREFIX, data.email, expiryTime);
      setCooldownSeconds(COOLDOWN_DURATION);
      setResendStatus('cooldown');
    } catch {
      toast.error(t('error_title'), { description: t('magic_error_generic') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!magicLinkEmail || resendStatus !== 'idle') {
      return;
    }
    setResendStatus('loading');
    try {
      const { error } = await sendMagicLink(magicLinkEmail);
      if (error) {
        setResendStatus('idle');
        return;
      }
      setResendStatus('success');
      setTimeout(() => {
        const expiryTime = Date.now() + COOLDOWN_DURATION * 1000;
        setCooldownExpiry(COOLDOWN_PREFIX, magicLinkEmail, expiryTime);
        setCooldownSeconds(COOLDOWN_DURATION);
        setResendStatus('cooldown');
      }, 2000);
    } catch {
      setResendStatus('idle');
    }
  };

  const title = tab === 'sign-in' ? t('signin_title') : t('signup_title');
  const subtitle
    = tab === 'sign-in' ? t('signin_subtitle') : t('signup_subtitle');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // Focus the email input rather than the first social button.
          const emailInput = document.querySelector<HTMLInputElement>(
            '[data-auth-dialog] input[type="email"]',
          );
          emailInput?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {magicLinkSent ? t('magic_confirmation_title') : title}
          </DialogTitle>
          <DialogDescription>
            {magicLinkSent ? t('magic_confirmation_subtitle') : subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Confirmation view (magic link sent) */}
        {magicLinkSent && (
          <div className="space-y-4 pt-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <Mail className="size-7 text-primary" />
            </div>
            {magicLinkEmail && (
              <div className="inline-block max-w-full break-all rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium">
                {magicLinkEmail}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendStatus !== 'idle'}
            >
              {resendStatus === 'idle' && (
                <>
                  <RefreshCw className="mr-2 size-4" />
                  {t('magic_resend_button')}
                </>
              )}
              {resendStatus === 'loading' && (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('magic_resend_loading')}
                </>
              )}
              {resendStatus === 'success' && (
                <>
                  <Check className="mr-2 size-4" />
                  {t('magic_resend_success')}
                </>
              )}
              {resendStatus === 'cooldown' && (
                <>{t('magic_resend_cooldown', { seconds: cooldownSeconds })}</>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>
              {t('magic_back_to_sign_in')}
            </Button>
          </div>
        )}

        {/* Form view (default) */}
        {!magicLinkSent && (
          <div className="space-y-4 pt-2" data-auth-dialog>
            <SocialAuthButtons
              onGoogleClick={() => handleOAuth('google')}
              onGitHubClick={() => handleOAuth('github')}
              loading={oauthLoading}
              disabled={submitting}
            />

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs uppercase text-muted-foreground">
                  {t('or')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <Label htmlFor="dialog-email" className="sr-only">
                  {t('email_label')}
                </Label>
                <input
                  id="dialog-email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  className={cn(INPUT_CLASS, 'h-11')}
                  aria-invalid={!!errors.email}
                  disabled={submitting || oauthLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.email.message as string}
                  </p>
                )}
              </div>

              {showPassword && (
                <div>
                  <Label htmlFor="dialog-password" className="sr-only">
                    {t('password_label')}
                  </Label>
                  <PasswordInput
                    id="dialog-password"
                    placeholder={t('password_placeholder')}
                    className="h-11"
                    aria-invalid={!!errors.password}
                    disabled={submitting || oauthLoading}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {errors.password.message as string}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={submitting || oauthLoading}
                className="w-full"
              >
                {submitting
                  ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="-ml-1 mr-2 size-5 animate-spin" />
                        {showPassword ? t('signing_in') : t('sending')}
                      </span>
                    )
                  : showPassword
                    ? (
                        t('sign_in_button')
                      )
                    : (
                        t('continue_button')
                      )}
              </Button>
            </form>

            {/* Toggle password mode (sign-in only) */}
            {tab === 'sign-in' && (
              <div className="flex items-center justify-center gap-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  {showPassword ? t('use_magic_link') : t('use_password')}
                </button>
                {showPassword && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <Link
                      href={`/${locale}/forgot-password`}
                      onClick={() => onOpenChange(false)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                    >
                      {t('forgot_password')}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Switch tab */}
            <p className="text-center text-sm text-muted-foreground">
              {tab === 'sign-up'
                ? (
                    <>
                      {t('already_have_account')}
                      {' '}
                      <button
                        type="button"
                        onClick={() => onTabChange('sign-in')}
                        className="font-semibold text-primary hover:underline"
                      >
                        {t('sign_in_link')}
                      </button>
                    </>
                  )
                : (
                    <>
                      {t('no_account')}
                      {' '}
                      <button
                        type="button"
                        onClick={() => onTabChange('sign-up')}
                        className="font-semibold text-primary hover:underline"
                      >
                        {t('sign_up_link')}
                      </button>
                    </>
                  )}
            </p>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground">
              {t('terms_text')}
              {' '}
              <Link
                href={`/${locale}/terms`}
                className="underline hover:text-foreground"
              >
                {t('terms_link')}
              </Link>
              {' '}
              {t('terms_and')}
              {' '}
              <Link
                href={`/${locale}/privacy`}
                className="underline hover:text-foreground"
              >
                {t('privacy_link')}
              </Link>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Provider (wraps children + renders dialog)                        */
/* ------------------------------------------------------------------ */

export const AuthDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const defaultRedirect = `/${locale}/dashboard`;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AuthTab>('sign-up');
  const [redirectPath, setRedirectPath] = useState(defaultRedirect);

  const openSignIn = useCallback(
    (path?: string) => {
      setRedirectPath(path ?? defaultRedirect);
      setTab('sign-in');
      setOpen(true);
    },
    [defaultRedirect],
  );

  const openSignUp = useCallback(
    (path?: string) => {
      setRedirectPath(path ?? defaultRedirect);
      setTab('sign-up');
      setOpen(true);
    },
    [defaultRedirect],
  );

  return (
    <AuthDialogContext value={{ openSignIn, openSignUp }}>
      {children}
      <AuthDialog
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        onTabChange={setTab}
        redirectPath={redirectPath}
      />
    </AuthDialogContext>
  );
};

/* ------------------------------------------------------------------ */
/*  Auto-opener (mount inside <Suspense> on the landing page)         */
/* ------------------------------------------------------------------ */

/**
 * Reads `auth=signin|signup` and `redirect=/path` from the URL and opens the
 * auth dialog accordingly. The middleware sets these params when an
 * unauthenticated user tries to reach a protected route, so cold visitors land
 * on the marketing page with the dialog already open and their deep link
 * preserved for after sign-in.
 *
 * Strips the params from the URL via router.replace so a refresh/back doesn't
 * re-open the dialog.
 */
export function AuthDialogAutoOpener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openSignIn, openSignUp } = useAuthDialog();

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth !== 'signin' && auth !== 'signup') {
      return;
    }

    // Open-redirect guard: only accept a same-origin internal path; anything
    // that could escape the origin falls back to the provider default.
    const redirect = searchParams.get('redirect');
    const safeRedirect = toSafeInternalPath(redirect, '');
    const redirectPath = safeRedirect || undefined;

    if (auth === 'signin') {
      openSignIn(redirectPath);
    } else {
      openSignUp(redirectPath);
    }

    // Strip auth/redirect from the URL so the dialog doesn't re-open on refresh
    // or browser back.
    const next = new URLSearchParams(searchParams);
    next.delete('auth');
    next.delete('redirect');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, pathname, router, openSignIn, openSignUp]);

  return null;
}
