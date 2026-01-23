import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AuthCodeError' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function AuthCodeErrorPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AuthCodeError' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
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
        <div className="rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-red-400 to-rose-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mb-6 text-sm text-gray-600 sm:text-base">
              {t('message')}
            </p>
            <p className="mb-8 text-sm text-gray-500">
              {t('help_text')}
            </p>

            <div className="space-y-3">
              <Link
                href="/sign-up"
                className="block w-full rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                {t('try_again')}
              </Link>
              <Link
                href="/sign-in"
                className="block w-full rounded-lg border-2 border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:border-purple-500 hover:bg-purple-50"
              >
                {t('sign_in')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
