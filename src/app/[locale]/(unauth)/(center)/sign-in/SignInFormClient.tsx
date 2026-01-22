'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

const createSignInSchema = (t: ReturnType<typeof useTranslations<'SignIn'>>) =>
  z.object({
    email: z.string().min(1, t('validation_email_required')).email(t('validation_email_invalid')),
    password: z.string().min(1, t('validation_password_required')),
  });

export default function SignInFormClient() {
  const t = useTranslations('SignIn');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const signInSchema = createSignInSchema(t);
  type SignInFormData = z.infer<typeof signInSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
  });

  // Load remember me preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('remember_me');
      if (savedPreference === 'true') {
        // Load saved preference on mount
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRememberMe(true);
      }
    }
  }, []);

  // Save remember me preference to localStorage
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('remember_me', checked.toString());
    }
  };

  const handleGoogleSignIn = async () => {
    setOAuthLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: t('error_oauth_google'),
        variant: 'destructive',
      });
      setOAuthLoading(false);
    }
    // Note: If no error, user will be redirected to OAuth provider
    // Loading state persists until redirect completes
  };

  const handleGitHubSignIn = async () => {
    setOAuthLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: t('error_oauth_github'),
        variant: 'destructive',
      });
      setOAuthLoading(false);
    }
    // Note: If no error, user will be redirected to OAuth provider
    // Loading state persists until redirect completes
  };

  const onSubmit = async (data: SignInFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      // Note: Remember me is handled by Supabase by default with persistent sessions
      // The checkbox is saved in localStorage for UI state persistence only
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        // Show generic error message for security (don't reveal which field is wrong)
        if (signInError.message.includes('Invalid login credentials')) {
          setServerError(t('error_invalid_credentials'));
        } else if (signInError.message.includes('Too many requests')) {
          setServerError(t('error_too_many_requests'));
        } else if (signInError.message.includes('Network')) {
          setServerError(t('error_network'));
        } else {
          setServerError(t('error_invalid_credentials'));
        }
        setLoading(false);
        return;
      }

      // Get redirect destination from URL params
      const redirectParam = searchParams.get('redirect');
      // Validate redirect URL to prevent open redirect vulnerability
      const redirectTo = redirectParam?.startsWith('/') ? redirectParam : `/${locale}/dashboard`;

      // Redirect to intended destination or dashboard
      router.push(redirectTo);
    } catch {
      setServerError(t('error_network'));
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 p-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] size-2/5 rounded-full bg-blue-100/50 opacity-60 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] size-2/5 rounded-full bg-blue-100/50 opacity-60 blur-3xl" />
      </div>

      {/* Back to Home Link */}
      <div className="absolute left-6 top-6 z-10">
        <Link
          href={`/${locale}`}
          className="group flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <div className="mr-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm transition-all group-hover:border-slate-300">
            <ArrowLeft className="size-4" />
          </div>
          {t('back_to_home')}
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 text-slate-600">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Social Auth Buttons */}
            <SocialAuthButtons
              onGoogleClick={handleGoogleSignIn}
              onGitHubClick={handleGitHubSignIn}
              loading={oauthLoading}
              disabled={loading || oauthLoading}
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-500">
                  {t('or_continue_with_email')}
                </span>
              </div>
            </div>

            {serverError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5 shrink-0 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{serverError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none text-slate-700">
                  {t('email_label')}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!errors.email}
                  disabled={loading || oauthLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none text-slate-700">
                  {t('password_label')}
                </label>
                <PasswordInput
                  id="password"
                  placeholder={t('password_placeholder')}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!errors.password}
                  disabled={loading || oauthLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={handleRememberMeChange}
                  disabled={loading || oauthLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('remember_me')}
                </label>
              </div>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t('forgot_password')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="-ml-1 mr-2 size-5 animate-spin" />
                      {t('signing_in')}
                    </span>
                  )
                : t('sign_in_button')}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-500">
                  {t('no_account')}
                </span>
              </div>
            </div>

            <Link
              href={`/${locale}/sign-up`}
              className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-medium text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              {t('sign_up_link')}
            </Link>
          </form>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 opacity-80" />
      </div>
    </div>
  );
}
