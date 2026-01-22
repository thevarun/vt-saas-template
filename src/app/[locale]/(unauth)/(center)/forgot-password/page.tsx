'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronLeft, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createClient } from '@/libs/supabase/client';

const createForgotPasswordSchema = (t: ReturnType<typeof useTranslations<'ForgotPassword'>>) =>
  z.object({
    email: z.string().min(1, t('validation_email_required')).email(t('validation_email_invalid')),
  });

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword');
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotPasswordSchema = createForgotPasswordSchema(t);
  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // Configure redirect URL for password reset
      const redirectTo = `${window.location.origin}/${locale}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (error) {
        // Only show errors for rate limiting or network issues
        // Do NOT show "email not found" errors (security)
        if (error.message.includes('rate') || error.message.includes('too many')) {
          setServerError(t('error_rate_limit'));
        } else if (error.message.includes('Network') || error.message.includes('network')) {
          setServerError(t('error_network'));
        } else {
          // For any other error, show generic network error
          // This prevents email enumeration attacks
          setServerError(t('error_network'));
        }
        setLoading(false);
        return;
      }

      // Success: transition to success state
      // Show SAME message regardless of whether email exists (security)
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      setLoading(false);
    } catch {
      setServerError(t('error_network'));
      setLoading(false);
    }
  };

  // Reset form to try another email
  const handleTryAnother = () => {
    setIsSubmitted(false);
    setSubmittedEmail('');
  };

  // Success state UI
  if (isSubmitted) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-10%] size-2/5 rounded-full bg-blue-100 opacity-50 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] size-2/5 rounded-full bg-slate-200 opacity-50 blur-[100px]" />
        </div>

        {/* Main Card */}
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl md:p-10">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20">
              <KeyRound className="size-6 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-2xl font-bold text-slate-900 md:text-3xl">
              {t('success_title')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 md:text-base">
              {t('success_message')}
            </p>
          </div>

          {/* Success Message */}
          <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-4 text-center text-sm text-green-700">
            {t('success_email_sent_to')}
            {' '}
            <span className="font-semibold">{submittedEmail}</span>
          </div>

          {/* Try Another Email */}
          <div className="mb-8 text-center">
            <button
              type="button"
              onClick={handleTryAnother}
              className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
            >
              {t('try_another_email')}
            </button>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link
              href={`/${locale}/sign-in`}
              className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              {t('back_to_sign_in')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form UI
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] size-2/5 rounded-full bg-blue-100 opacity-50 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] size-2/5 rounded-full bg-slate-200 opacity-50 blur-[100px]" />
      </div>

      {/* Back to Sign In Link - Desktop */}
      <div className="absolute left-8 top-8 z-10 hidden md:block">
        <Link
          href={`/${locale}/sign-in`}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          {t('back_to_sign_in')}
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl md:p-10">
        {/* Mobile Back Link */}
        <div className="mb-8 md:hidden">
          <Link
            href={`/${locale}/sign-in`}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ChevronLeft className="size-4" />
            {t('back')}
          </Link>
        </div>

        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20">
            <KeyRound className="size-6 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-2xl font-bold text-slate-900 md:text-3xl">
            {t('title')}
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 md:text-base">
            {t('subtitle')}
          </p>
        </div>

        {serverError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {t('email_label')}
            </label>
            <input
              id="email"
              type="email"
              placeholder={t('email_placeholder')}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!errors.email}
              disabled={loading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>{t('sending')}</span>
                  </>
                )
              : t('submit_button')}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/sign-in`}
            className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            {t('back_to_sign_in')}
          </Link>
        </div>
      </div>
    </div>
  );
}
