import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LandingPageTracker } from '@/components/analytics/LandingPageTracker';
import { SITE_NAME } from '@/libs/seo/constants';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { CTA } from '@/templates/CTA';
import { FAQ } from '@/templates/FAQ';
import { Features } from '@/templates/Features';
import { Footer } from '@/templates/Footer';
import { Hero } from '@/templates/Hero';
import { Navbar } from '@/templates/Navbar';
import { AppConfig } from '@/utils/AppConfig';

// Force dynamic rendering to avoid RSC serialization issues during build
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
      // Default locale is unprefixed per localePrefix: 'as-needed'
      path: locale === AppConfig.defaultLocale ? '/' : `/${locale}`,
    }),
  };
}

const IndexPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale: _locale } = await props.params;

  // AC #4: Auth state is now checked client-side for better performance
  // Landing page is statically generated for fast load times and SEO
  return (
    <>
      <LandingPageTracker />
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
};

export default IndexPage;
