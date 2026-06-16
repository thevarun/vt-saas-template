/**
 * RelatedPages Component
 *
 * Displays related pages from the same category.
 * Helps with internal linking and keeping users engaged.
 *
 * PATTERN:
 * - Shows 3 related pages by default
 * - Same category, different pages
 * - Improves site navigation and SEO through internal links
 */

import Link from 'next/link';

import type { PseoPage } from '@/libs/pseo/data';

type RelatedPagesProps = {
  pages: PseoPage[];
  categorySlug: string;
  locale: string;
};

export function RelatedPages({ pages, categorySlug, locale }: RelatedPagesProps) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">Related Posts</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {pages.map(page => (
          <Link
            key={page.id}
            href={`/${locale}/blog/${categorySlug}/${page.slug}`}
            className="group block focus-visible:outline-none"
          >
            <article className="flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground/15 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <h3 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {page.title}
              </h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {page.description}
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read more
                {' '}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
