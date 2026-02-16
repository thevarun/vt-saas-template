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
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-6 text-2xl font-bold text-foreground">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map(page => (
          <Link
            key={page.id}
            href={`/${locale}/articles/${categorySlug}/${page.slug}`}
            className="group block"
          >
            <article className="rounded-lg border border-border p-6 transition-all hover:border-foreground/20 hover:shadow-md">
              <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {page.title}
              </h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {page.description}
              </p>
              <div className="mt-4 text-sm font-medium text-primary">
                Read more →
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
