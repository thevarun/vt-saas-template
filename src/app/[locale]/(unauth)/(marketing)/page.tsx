import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { LandingPageTracker } from '@/components/analytics/LandingPageTracker';
import { AuthDialogAutoOpener } from '@/components/marketing/auth-dialog';
import { SITE_NAME } from '@/libs/seo/constants';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { CTA } from '@/templates/CTA';
import { FAQ } from '@/templates/FAQ';
import { Features } from '@/templates/Features';
import { Hero } from '@/templates/Hero';
import { AppConfig } from '@/utils/AppConfig';

// Force dynamic rendering to avoid RSC serialization issues during build.
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  const title = `${t('meta_title')} | ${SITE_NAME}`;
  const description = t('meta_description');

  return {
    title,
    description,
    ...generateSocialMetadata({
      title,
      description,
      // Default locale is unprefixed per localePrefix: 'as-needed'.
      path: locale === AppConfig.defaultLocale ? '/' : `/${locale}`,
    }),
  };
}

/**
 * Primary marketing landing (`/`).
 *
 * Lives inside `(marketing)` so the `AuthDialogProvider`, `MarketingNavbar`,
 * and `MarketingFooter` all come from that route group's layout (the CTAs there
 * open the overlay auth dialog). The `AuthDialogAutoOpener` MUST live in the
 * page (not a layout) inside `<Suspense>` because it reads `useSearchParams()`,
 * and it stays a descendant of the layout's provider.
 */
const IndexPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale: _locale } = await props.params;

  return (
    <>
      <Suspense>
        <LandingPageTracker />
        <AuthDialogAutoOpener />
      </Suspense>
      <Hero />
      <Features />
      <FAQ />
      <CTA />
    </>
  );
};

export default IndexPage;
