import '@/styles/global.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster as SonnerToaster } from 'sonner';

import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { ThemeProvider } from '@/components/theme';
import { Toaster } from '@/components/ui/toaster';
import { getSiteUrl } from '@/libs/seo/config';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
} from '@/libs/seo/constants';
import { generateHreflangLinks } from '@/libs/seo/hreflang';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { AllLocales } from '@/utils/AppConfig';

export function generateMetadata(): Metadata {
  // Root layout provides default metadata for the home page.
  // Individual pages should override with their own generateMetadata
  // for correct path-specific hreflang and social metadata.
  const pathname = '/';

  // Generate hreflang links for all locales
  const hreflangLinks = generateHreflangLinks(pathname);

  // Convert to Next.js Metadata alternates.languages format
  const languages = hreflangLinks.reduce(
    (acc, link) => {
      acc[link.hreflang] = link.href;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Generate social metadata (Open Graph & Twitter Cards)
  const socialMetadata = generateSocialMetadata({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: pathname,
  });

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: {
      canonical: `${getSiteUrl()}/`,
      languages,
    },
    ...socialMetadata,
    icons: [
      {
        rel: 'apple-touch-icon',
        url: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
      {
        rel: 'icon',
        url: '/favicon.ico',
      },
    ],
  };
}

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  // Using internationalization in Client Components
  const messages = await getMessages();

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-ring focus:rounded-md"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <PostHogProvider>
            <NextIntlClientProvider
              locale={locale}
              messages={messages}
            >
              <main id="main-content">{props.children}</main>
              <Toaster />
              <SonnerToaster position="bottom-right" />
            </NextIntlClientProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
