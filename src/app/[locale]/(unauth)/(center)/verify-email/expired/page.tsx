'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/libs/supabase/client';

export default function ExpiredLinkPage() {
  const t = useTranslations('VerifyEmail');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Get email from URL params or fetch from user session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get email from user session
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setEmail(user.email);
        }
      });
    }
  }, [searchParams]);

  const handleResendClick = () => {
    router.push(`/${locale}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}`}
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:left-8 sm:top-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 size-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        {t('back_to_home')}
      </Link>

      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-linear-to-r from-red-400 to-rose-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {t('expired_title')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('expired_message')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button
              type="button"
              onClick={handleResendClick}
              className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg"
            >
              {t('resend_button')}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
