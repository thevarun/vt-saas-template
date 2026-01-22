'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

const createSignUpSchema = (t: ReturnType<typeof useTranslations<'SignUp'>>) =>
  z.object({
    email: z.string().email(t('validation_email_invalid')),
    password: z
      .string()
      .min(8, t('validation_password_min'))
      .regex(/[A-Z]/, t('validation_password_uppercase'))
      .regex(/[a-z]/, t('validation_password_lowercase'))
      .regex(/\d/, t('validation_password_number')),
  });

export default function SignUpPage() {
  const t = useTranslations('SignUp');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const signUpSchema = createSignUpSchema(t);
  type SignUpFormData = z.infer<typeof signUpSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  const handleGoogleSignUp = async () => {
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
  };

  const handleGitHubSignUp = async () => {
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
  };

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Map Supabase errors to user-friendly messages
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          setServerError(t('error_email_exists'));
        } else {
          setServerError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Redirect to verify-email page instead of showing inline success
      window.location.href = `/${locale}/verify-email?email=${encodeURIComponent(data.email)}`;
    } catch {
      setServerError(t('error_unexpected'));
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
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="size-6"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  {serverError === t('error_email_exists') && (
                    <Link
                      href={`/${locale}/sign-in`}
                      className="mt-1 text-sm font-semibold text-red-900 underline hover:text-red-700"
                    >
                      {t('error_email_exists_action')}
                    </Link>
                  )}
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
                  aria-invalid={!!errors.password}
                  disabled={loading || oauthLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <div className="text-xs text-slate-500">
                  <p className="font-medium text-slate-600">{t('password_requirements')}</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    <li>{t('password_min_chars')}</li>
                    <li>{t('password_uppercase')}</li>
                    <li>{t('password_lowercase')}</li>
                    <li>{t('password_number')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading || !isValid}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="-ml-1 mr-2 size-5 animate-spin" />
                      {t('submit_loading')}
                    </span>
                  )
                : t('submit_button')}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  {t('or_continue_with')}
                </span>
              </div>
            </div>

            {/* Social Auth Buttons */}
            <SocialAuthButtons
              onGoogleClick={handleGoogleSignUp}
              onGitHubClick={handleGitHubSignUp}
              loading={oauthLoading}
              disabled={loading || oauthLoading}
            />

            {/* Footer Link */}
            <p className="mt-8 text-center text-sm text-slate-600">
              {t('already_have_account')}
              {' '}
              <Link
                href={`/${locale}/sign-in`}
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                {t('sign_in_link')}
              </Link>
            </p>
          </form>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 opacity-80" />
      </div>
    </div>
  );
}
