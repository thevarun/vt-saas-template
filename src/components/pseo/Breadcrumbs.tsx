/**
 * Breadcrumbs Component
 *
 * Provides navigation breadcrumbs for pSEO pages.
 * Helps with SEO and user navigation.
 *
 * PATTERN:
 * - Shows hierarchical path: Home > Category > Page
 * - Uses schema.org BreadcrumbList for SEO
 * - Accessible with proper ARIA labels
 */

import Link from 'next/link';

import type { PseoCategory } from '@/libs/pseo/data';
import { getSiteUrl } from '@/libs/seo/config';

type BreadcrumbsProps = {
  category: PseoCategory;
  pageTitle: string;
  locale: string;
  articlesLabel?: string;
};

export function Breadcrumbs({ category, pageTitle, locale, articlesLabel = 'Articles' }: BreadcrumbsProps) {
  const items = [
    { name: 'Home', href: `/${locale}` },
    { name: articlesLabel, href: `/${locale}/articles` },
    { name: category.name, href: `/${locale}/articles/${category.slug}` },
    { name: pageTitle, href: null }, // Current page, not a link
  ];

  // Schema.org structured data for breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      ...(item.href && { item: `${getSiteUrl()}${item.href}` }),
    })),
  };

  return (
    <>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={item.name} className="flex items-center">
              {index > 0 && <span className="mr-2">/</span>}
              {item.href
                ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  )
                : (
                    <span className="font-medium text-foreground">{item.name}</span>
                  )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
