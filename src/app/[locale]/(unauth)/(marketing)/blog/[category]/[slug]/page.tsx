import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PseoTemplate } from '@/components/pseo';
import {
  getAllPageParams,
  getCategoryBySlug,
  getPageBySlug,
  getRelatedPages,
} from '@/libs/pseo/data';
import { getSiteUrl } from '@/libs/seo/config';
import { generateHreflangAlternates } from '@/libs/seo/hreflang';
import { generateSocialMetadata } from '@/libs/seo/opengraph';

type PseoPageProps = {
  params: Promise<{
    locale: string;
    category: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const allParams = await getAllPageParams();
  return allParams;
}

export async function generateMetadata(props: PseoPageProps): Promise<Metadata> {
  const params = await props.params;
  const { category: categorySlug, slug } = params;

  const page = await getPageBySlug(categorySlug, slug);
  const category = await getCategoryBySlug(categorySlug);

  if (!page || !category) {
    return {
      title: 'Page Not Found',
    };
  }

  // Match the other marketing pages: shared OG/Twitter + og:image via
  // generateSocialMetadata (with the article og:type + publishedTime), hreflang
  // alternates via generateHreflangAlternates, single default-locale canonical.
  const path = `/blog/${categorySlug}/${slug}`;
  const languages = generateHreflangAlternates(path);

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    ...generateSocialMetadata({
      title: page.title,
      description: page.description,
      path,
      type: 'article',
      publishedTime: page.lastModified,
    }),
    alternates: {
      canonical: `${getSiteUrl()}${path}`,
      languages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function PseoPage(props: PseoPageProps) {
  const params = await props.params;
  const { category: categorySlug, slug, locale } = params;

  const [page, category] = await Promise.all([
    getPageBySlug(categorySlug, slug),
    getCategoryBySlug(categorySlug),
  ]);

  if (!page || !category) {
    notFound();
  }

  const relatedPages = await getRelatedPages(categorySlug, slug, 3);

  return (
    <PseoTemplate
      page={page}
      category={category}
      relatedPages={relatedPages}
      locale={locale}
    />
  );
}
