/**
 * PseoTemplate Component
 *
 * Main template for programmatic SEO pages.
 * Renders markdown content with proper styling.
 *
 * PATTERN:
 * - Uses react-markdown for content rendering
 * - Includes ShareWidget for social sharing
 * - Responsive typography
 * - Accessible heading hierarchy
 *
 * CUSTOMIZATION:
 * - Modify prose styles in className
 * - Add custom markdown components
 * - Adjust layout as needed
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ShareWidget } from '@/components/share';
import type { PseoCategory, PseoPage } from '@/libs/pseo/data';

import { Breadcrumbs } from './Breadcrumbs';
import { RelatedPages } from './RelatedPages';

type PseoTemplateProps = {
  page: PseoPage;
  category: PseoCategory;
  relatedPages: PseoPage[];
  locale: string;
};

export function PseoTemplate({ page, category, relatedPages, locale }: PseoTemplateProps) {
  // Construct the current page URL for sharing
  const pageUrl = typeof window !== 'undefined'
    ? window.location.href
    : `/${locale}/articles/${category.slug}/${page.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb navigation */}
        <Breadcrumbs category={category} pageTitle={page.title} locale={locale} articlesLabel="Articles" />

        {/* Article header */}
        <header className="mb-8">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {category.name}
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            {page.title}
          </h1>
          <p className="mb-4 text-xl text-muted-foreground">
            {page.description}
          </p>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <time className="text-sm text-muted-foreground">
              Last updated:
              {' '}
              {new Date(page.lastModified).toLocaleDateString()}
            </time>
            <ShareWidget
              url={pageUrl}
              title={page.title}
              description={page.description}
            />
          </div>
        </header>

        {/* Article content */}
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          {/*
            ReactMarkdown converts markdown to HTML with proper styling.
            The prose classes from Tailwind Typography plugin handle typography.

            CUSTOMIZATION:
            - Add custom components via the 'components' prop
            - Modify prose theme in tailwind.config.ts
            - Add syntax highlighting for code blocks if needed
          */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom heading IDs for anchor links
              h1: ({ children, ...props }) => <h1 id={slugify(String(children))} {...props}>{children}</h1>,
              h2: ({ children, ...props }) => <h2 id={slugify(String(children))} {...props}>{children}</h2>,
              h3: ({ children, ...props }) => <h3 id={slugify(String(children))} {...props}>{children}</h3>,
            }}
          >
            {page.content}
          </ReactMarkdown>
        </article>

        {/* Keywords (for context, could be hidden with sr-only) */}
        {page.keywords.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Topics</h2>
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
        <RelatedPages pages={relatedPages} categorySlug={category.slug} locale={locale} />
      </div>
    </div>
  );
}

/**
 * Simple slugify function for heading IDs
 * Converts "Deep Work Strategies" to "deep-work-strategies"
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
