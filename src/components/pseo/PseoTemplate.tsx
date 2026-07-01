/**
 * PseoTemplate Component
 *
 * Main template for programmatic SEO / blog pages.
 * Renders MDX content via next-mdx-remote/rsc with custom components, emits
 * Article JSON-LD structured data, and composes breadcrumbs, social sharing,
 * and related posts.
 *
 * PATTERN:
 * - MDX body is rendered with remark-gfm (GFM tables/strikethrough/etc.) and
 *   rehype-slug (anchor IDs on headings for in-page links).
 * - Custom JSX components used inside articles are registered in
 *   src/components/pseo/mdx-components.tsx (next-mdx-remote has no import/export).
 * - Article JSON-LD uses SITE_NAME for author/publisher and a locale-aware
 *   canonical URL.
 */

import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { ShareWidget } from '@/components/share';
import type { PseoCategory, PseoPage } from '@/libs/pseo/data';
import { getSiteUrl } from '@/libs/seo/config';
import { SITE_NAME } from '@/libs/seo/constants';
import { serializeJsonLd } from '@/libs/seo/json-ld';
import { getI18nPath } from '@/utils/Helpers';

import { Breadcrumbs } from './Breadcrumbs';
import { mdxComponents } from './mdx-components';
import { RelatedPages } from './RelatedPages';

type PseoTemplateProps = {
  page: PseoPage;
  category: PseoCategory;
  relatedPages: PseoPage[];
  locale: string;
};

export function PseoTemplate({
  page,
  category,
  relatedPages,
  locale,
}: PseoTemplateProps) {
  // Absolute, locale-aware URL used for both the canonical JSON-LD id and social
  // sharing. This is an RSC, so `window` is never available — derive it from the
  // site URL rather than relying on a client-only `window.location.href`.
  const canonicalUrl = `${getSiteUrl()}${getI18nPath(`/blog/${category.slug}/${page.slug}`, locale)}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': page.title,
    'description': page.description,
    'datePublished': page.lastModified,
    'dateModified': page.lastModified,
    'author': {
      '@type': 'Organization',
      'name': SITE_NAME,
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  return (
    <>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/dom-no-dangerously-set-innerhtml -- JSON-LD structured data; serializeJsonLd escapes `<` to prevent </script> breakout
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
      <div className="container mx-auto max-w-3xl px-4 pb-20 pt-12">
        {/* Breadcrumb navigation */}
        <Breadcrumbs
          category={category}
          pageTitle={page.title}
          locale={locale}
          rootLabel="Blog"
        />

        {/* Article header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {page.description}
          </p>
          <div className="mt-8 flex items-center justify-between border-b border-border pb-6">
            <time className="text-sm text-muted-foreground">
              Last updated
              {' '}
              {new Date(page.lastModified).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            <ShareWidget
              url={canonicalUrl}
              title={page.title}
              description={page.description}
            />
          </div>
        </header>

        {/* Article content (MDX) */}
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          <MDXRemote
            source={page.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </article>

        {/* Keywords as topic pills */}
        {page.keywords.length > 0 && (
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {page.keywords.map(keyword => (
                <span
                  key={keyword}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related pages section */}
        <RelatedPages
          pages={relatedPages}
          categorySlug={category.slug}
          locale={locale}
        />
      </div>
    </>
  );
}
