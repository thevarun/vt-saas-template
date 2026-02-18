'use client';

import { ArrowLeft, Check, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

const COOLDOWN_DURATION = 60; // 60 seconds

function getCooldownKey(email: string): string {
  return `email_resend_cooldown_${email}`;
}

function getCooldownExpiry(email: string): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(getCooldownKey(email));
  return stored ? Number.parseInt(stored, 10) : null;
}

function setCooldownExpiry(email: string, expiry: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(getCooldownKey(email), expiry.toString());
}

function getRemainingCooldown(email: string): number {
  const expiry = getCooldownExpiry(email);
  if (!expiry) {
    return 0;
  }
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

type ResendStatus = 'idle' | 'loading' | 'success' | 'cooldown';

export default function VerifyEmailPage() {
  const t = useTranslations('VerifyEmail');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [email, setEmail] = useState<string>('');
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    // Get email from URL params or fetch from user session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      const remaining = getRemainingCooldown(emailParam);
      if (remaining > 0) {
        setCooldownSeconds(remaining);
        setResendStatus('cooldown');
      }
      setCheckingUser(false);
    } else {
      // Try to get email from user session
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setEmail(user.email);
          const remaining = getRemainingCooldown(user.email);
          if (remaining > 0) {
            setCooldownSeconds(remaining);
            setResendStatus('cooldown');
          }

          // If user is already verified, redirect to dashboard
          if (user.email_confirmed_at) {
            router.push(`/${locale}/dashboard`);
            return;
          }
        }
        setCheckingUser(false);
      });
    }
  }, [searchParams, router, locale]);

  useEffect(() => {
    if (resendStatus === 'cooldown' && cooldownSeconds > 0) {
      const interval = setInterval(() => {
        const remaining = getRemainingCooldown(email);
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
  }, [resendStatus, cooldownSeconds, email]);

  const handleResendEmail = async () => {
    if (!email || resendStatus !== 'idle') {
      return;
    }

    setResendStatus('loading');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: t('error_title'),
          description: error.message || t('resend_error'),
          variant: 'destructive',
        });
        setResendStatus('idle');
        return;
      }

      // Show success state briefly
      setResendStatus('success');

      // After 2 seconds, switch to cooldown
      setTimeout(() => {
        const expiryTime = Date.now() + COOLDOWN_DURATION * 1000;
        setCooldownExpiry(email, expiryTime);
        setCooldownSeconds(COOLDOWN_DURATION);
        setResendStatus('cooldown');
      }, 2000);
    } catch {
      toast({
        title: t('error_title'),
        description: t('resend_error'),
        variant: 'destructive',
      });
      setResendStatus('idle');
    }
  };

  if (checkingUser) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 p-4">
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="flex items-center justify-center p-8 sm:p-10">
            <Loader2 className="size-8 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 p-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] size-2/5 rounded-full bg-blue-100/50 opacity-60 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] size-2/5 rounded-full bg-emerald-100/50 opacity-60 blur-3xl" />
      </div>

      {/* Back to Home Link */}
      <div className="absolute left-6 top-6 z-10">
        <Link
          href={`/${locale}`}
          className="group flex items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <div className="mr-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-xs transition-all group-hover:border-slate-300">
            <ArrowLeft className="size-4" />
          </div>
          {t('back_to_home')}
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="p-8 text-center sm:p-10">
          {/* Icon */}
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
            <Mail className="size-8 text-emerald-600" />
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-2xl font-bold text-slate-900">
            {t('title')}
          </h1>

          <p className="mb-6 text-slate-600">{t('subtitle')}</p>

          {/* Email Display */}
          {email && (
            <div className="mb-8 inline-block rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-lg font-medium text-slate-900">
              {email}
            </div>
          )}

          <p className="mb-8 text-sm leading-relaxed text-slate-500">
            {t('message')}
          </p>

          {/* Resend Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendStatus !== 'idle' || !email}
              className={`
                relative flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                ${resendStatus === 'idle' ? 'border border-slate-300 bg-white text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50' : ''}
                ${resendStatus === 'loading' ? 'cursor-wait border border-slate-200 bg-slate-50 text-slate-400' : ''}
                ${resendStatus === 'success' ? 'cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700' : ''}
                ${resendStatus === 'cooldown' ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400' : ''}
              `}
            >
              {resendStatus === 'idle' && (
                <>
                  <RefreshCw className="size-4" />
                  {t('resend_button')}
                </>
              )}

              {resendStatus === 'loading' && (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('resend_loading')}
                </>
              )}

              {resendStatus === 'success' && (
                <>
                  <Check className="size-4" />
                  {t('resend_success')}
                </>
              )}

              {resendStatus === 'cooldown' && (
                <>{t('resend_cooldown', { seconds: cooldownSeconds })}</>
              )}
            </button>

            <Link
              href={`/${locale}/sign-in`}
              className="mt-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              {t('back_to_sign_in')}
            </Link>
          </div>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-80" />
      </div>

      {/* Footer Help */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          {t('wrong_email')}
          {' '}
          <Link
            href={`/${locale}/sign-up`}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {t('try_different_email')}
          </Link>
        </p>
      </div>
    </div>
  );
}
