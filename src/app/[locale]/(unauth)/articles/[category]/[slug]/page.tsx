import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PseoTemplate } from '@/components/pseo';
import {
  getAllPageParams,
  getCategoryBySlug,
  getPageBySlug,
  getRelatedPages,
} from '@/libs/pseo/data';
import { getBaseUrl } from '@/utils/Helpers';

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
  const { category: categorySlug, slug, locale } = params;

  const page = await getPageBySlug(categorySlug, slug);
  const category = await getCategoryBySlug(categorySlug);

  if (!page || !category) {
    return {
      title: 'Page Not Found',
    };
  }

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/${locale}/articles/${categorySlug}/${slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    openGraph: {
      title: page.title,
      description: page.description,
      url: pageUrl,
      siteName: 'VT SaaS Template',
      locale,
      type: 'article',
      publishedTime: page.lastModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
    alternates: {
      canonical: pageUrl,
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
