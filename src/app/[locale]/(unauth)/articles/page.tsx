import type { Metadata } from 'next';
import Link from 'next/link';

import { getPagesByCategory, loadCategories } from '@/libs/pseo/data';
import { getBaseUrl } from '@/utils/Helpers';

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = getBaseUrl();

  return {
    title: 'Articles',
    description: 'Browse our collection of articles across various topics.',
    alternates: {
      canonical: `${baseUrl}/${locale}/articles`,
    },
  };
}

export default async function ArticlesIndexPage(props: ArticlesPageProps) {
  const { locale } = await props.params;
  const categories = await loadCategories();

  const categoriesWithPages = await Promise.all(
    categories.map(async (category) => {
      const pages = await getPagesByCategory(category.slug);
      return { category, pages };
    }),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">Articles</span>
        </nav>

        <header className="mb-12">
          <h1 className="mb-3 text-4xl font-bold text-foreground">Articles</h1>
          <p className="text-lg text-muted-foreground">
            Browse our collection of articles across various topics.
          </p>
        </header>

        <div className="space-y-16">
          {categoriesWithPages.map(({ category, pages }) => (
            <section key={category.id}>
              <div className="mb-6 flex items-baseline justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
                  <p className="mt-1 text-muted-foreground">{category.description}</p>
                </div>
                <Link
                  href={`/${locale}/articles/${category.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pages.map(page => (
                  <Link
                    key={page.id}
                    href={`/${locale}/articles/${category.slug}/${page.slug}`}
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
                        Read more &rarr;
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
