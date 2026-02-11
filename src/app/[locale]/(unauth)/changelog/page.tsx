import fs from 'node:fs/promises';
import path from 'node:path';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Product updates and release notes',
  openGraph: {
    title: 'Changelog',
    description: 'Product updates and release notes',
  },
};

async function getChangelogContent(): Promise<string | null> {
  try {
    const changelogPath = path.join(process.cwd(), 'docs', 'CHANGELOG.md');
    const content = await fs.readFile(changelogPath, 'utf-8');
    return content;
  } catch {
    // File doesn't exist yet
    return null;
  }
}

export default async function ChangelogPage(props: {
  params: Promise<{ locale: string }>;
}) {
  await props.params;
  const t = await getTranslations('Changelog');
  let content = await getChangelogContent();

  // Strip the leading "# Changelog" heading since the page renders its own translated header
  if (content) {
    content = content.replace(/^#[^\n]+\n+/, '');
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('description')}
        </p>
      </header>

      {content
        ? (
            <article className="prose prose-neutral max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          )
        : (
            <div className="rounded-lg border border-border bg-muted p-8 text-center">
              <h2 className="text-xl font-semibold text-foreground">{t('noReleases')}</h2>
              <p className="mt-2 text-muted-foreground">
                {t('noReleasesDescription')}
              </p>
            </div>
          )}
    </main>
  );
}
