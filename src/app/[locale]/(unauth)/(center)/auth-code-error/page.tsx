import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { use } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('AuthError');

  return {
    title: t('oauth_error_title'),
  };
}

export default function AuthCodeErrorPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const t = useTranslations('AuthError');
  const params = use(props.params);
  const locale = params.locale;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 p-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] size-2/5 rounded-full bg-red-100/50 opacity-60 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] size-2/5 rounded-full bg-red-100/50 opacity-60 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="p-8 sm:p-10">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8 text-red-600"
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
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {t('oauth_error_title')}
            </h1>
            <p className="text-slate-600">
              {t('oauth_error_message')}
            </p>
          </div>

          {/* Back to Sign In Button */}
          <Link
            href={`/${locale}/sign-in`}
            className="group flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-2 size-5 transition-transform group-hover:-translate-x-1" />
            {t('back_to_sign_in')}
          </Link>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-400 to-red-500 opacity-80" />
      </div>
    </div>
  );
}
