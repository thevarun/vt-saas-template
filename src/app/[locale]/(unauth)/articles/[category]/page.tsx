import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getAllCategoryParams,
  getCategoryBySlug,
  getPagesByCategory,
} from '@/libs/pseo/data';
import { getBaseUrl } from '@/utils/Helpers';

type CategoryPageProps = {
  params: Promise<{
    locale: string;
    category: string;
  }>;
};

export async function generateStaticParams() {
  return getAllCategoryParams();
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const { locale, category: categorySlug } = await props.params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const baseUrl = getBaseUrl();

  return {
    title: `${category.name} Articles`,
    description: category.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/articles/${categorySlug}`,
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { locale, category: categorySlug } = await props.params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const pages = await getPagesByCategory(categorySlug);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-8">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href={`/${locale}/articles`} className="hover:text-foreground">
              Articles
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
          <h1 className="mb-3 text-4xl font-bold text-foreground">{category.name}</h1>
          <p className="text-lg text-muted-foreground">{category.description}</p>
        </header>

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
                  Read more &rarr;
                </div>
              </article>
            </Link>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No articles in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
