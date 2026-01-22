'use client';

/**
 * Reset Password Page
 * Adapted from MagicPatterns design: https://www.magicpatterns.com/c/mvjem6dcsdqzubf6kpavmg
 *
 * Adaptations made:
 * - Added Supabase authentication integration (token verification, password update)
 * - Added i18n with next-intl
 * - Added password validation (8+ chars, uppercase, lowercase, number) per project requirements
 * - Added security features (session invalidation after password update)
 * - Added toast notifications for feedback
 * - Added loading/error/expired token states
 * - Used project's PasswordInput component
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

type TokenState = 'loading' | 'valid' | 'expired' | 'invalid';

// Redirect delay after successful password reset
const REDIRECT_DELAY_MS = 2000;

const createResetPasswordSchema = (t: ReturnType<typeof useTranslations<'ResetPassword'>>) =>
  z.object({
    password: z
      .string()
      .min(8, t('validation_password_min'))
      .regex(/[A-Z]/, t('validation_password_uppercase'))
      .regex(/[a-z]/, t('validation_password_lowercase'))
      .regex(/\d/, t('validation_password_number')),
    confirmPassword: z.string().min(1, t('validation_confirm_required')),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('error_passwords_match'),
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const t = useTranslations('ResetPassword');
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { toast } = useToast();

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordSchema = createResetPasswordSchema(t);
  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        // Try to differentiate between expired and invalid tokens
        if (error.message.includes('expired') || error.message.includes('Expired')) {
          setTokenState('expired');
        } else {
          setTokenState('invalid');
        }
        return;
      }

      if (!session || session.user.aud !== 'recovery') {
        setTokenState('invalid');
        return;
      }

      setTokenState('valid');
    };

    verifyToken();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        const errorMessage = t('error_update_failed');
        setServerError(errorMessage);
        toast({
          title: t('error_title'),
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // CRITICAL: Sign out to invalidate the recovery session
      // This prevents token reuse attacks
      await supabase.auth.signOut();

      // Success: show success state
      setIsSuccess(true);
      setLoading(false);

      // Show success toast
      toast({
        title: t('success_title'),
        description: t('success_message'),
      });
    } catch {
      const errorMessage = t('error_update_failed');
      setServerError(errorMessage);
      toast({
        title: t('error_title'),
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Handle redirect with cleanup on component unmount
  useEffect(() => {
    if (isSuccess) {
      const timeoutId = setTimeout(() => {
        router.push(`/${locale}/sign-in`);
      }, REDIRECT_DELAY_MS);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isSuccess, router, locale]);

  // Loading state
  if (tokenState === 'loading') {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-slate-600">{t('verifying_token')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid/Expired token state
  if (tokenState === 'invalid' || tokenState === 'expired') {
    const isExpired = tokenState === 'expired';

    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Lock className="size-6" />
          </div>

          {/* Header */}
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            {t(isExpired ? 'expired_title' : 'invalid_title')}
          </h2>
          <p className="mb-8 text-slate-600">
            {t(isExpired ? 'expired_message' : 'invalid_message')}
          </p>

          {/* Action Button */}
          <Link
            href={`/${locale}/forgot-password`}
            className="block w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-slate-800"
          >
            {t(isExpired ? 'expired_action' : 'invalid_action')}
          </Link>
        </div>
      </div>
    );
  }

  // Success state (matches MagicPatterns design)
  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <CheckCircle2 className="size-6" />
          </div>

          {/* Header */}
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            {t('success_title')}
          </h2>
          <p className="mb-8 text-slate-600">
            {t('success_message')}
          </p>

          {/* Back to Sign In Button */}
          <Link
            href={`/${locale}/sign-in`}
            className="block w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-slate-800"
          >
            {t('back_to_signin')}
          </Link>
        </div>
      </div>
    );
  }

  // Form UI (valid token) - Adapted from MagicPatterns
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      {/* Back Link - Positioned at top left */}
      <div className="absolute left-6 top-6 md:left-8 md:top-8">
        <Link
          href={`/${locale}`}
          className="group flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 size-4 transition-transform group-hover:-translate-x-1" />
          {t('back_to_home')}
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl md:p-10">
          {/* Header Icon */}
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20">
            <Lock className="size-6 text-white" />
          </div>

          {/* Text Content */}
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">
            {t('title')}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-600">
            {t('subtitle')}
          </p>

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {t('password_label')}
              </label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('password')}
              />
              {errors.password
                ? (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.password.message}
                    </p>
                  )
                : (
                    <p className="mt-1.5 text-xs text-slate-500">
                      {t('requirement_hint')}
                    </p>
                  )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {t('confirm_password_label')}
              </label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                aria-invalid={!!errors.confirmPassword}
                disabled={loading}
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/10'
                }`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>{t('resetting')}</span>
                    </>
                  )
                : t('submit_button')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
