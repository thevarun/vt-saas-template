import fs from 'node:fs/promises';
import path from 'node:path';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import type { ChangelogTag, ChangelogVersion } from './types';
import { CHANGELOG_TAGS } from './types';
import { UnderTheHood } from './under-the-hood';

const VALID_TAGS = new Set<string>(CHANGELOG_TAGS);

function isValidTag(tag: unknown): tag is ChangelogTag {
  return typeof tag === 'string' && VALID_TAGS.has(tag);
}

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Product updates and release notes',
  openGraph: {
    title: 'Changelog',
    description: 'Product updates and release notes',
  },
};

async function getChangelog(): Promise<ChangelogVersion[] | null> {
  try {
    const changelogPath = path.join(process.cwd(), 'docs', 'changelog.json');
    const raw = await fs.readFile(changelogPath, 'utf-8');
    const parsed = JSON.parse(raw) as { versions?: ChangelogVersion[] };
    if (!parsed.versions || parsed.versions.length === 0) {
      return null;
    }
    // The JSON is produced by an LLM humanizer; the workflow only checks it
    // parses, not that `tag` is one of CHANGELOG_TAGS. Drop highlights with an
    // out-of-range tag so they can't render as an empty, mis-styled badge.
    return parsed.versions.map(version => ({
      ...version,
      highlights: version.highlights.filter(highlight =>
        isValidTag(highlight.tag),
      ),
    }));
  } catch {
    // File doesn't exist or is invalid yet
    return null;
  }
}

function formatDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export default async function ChangelogPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations('Changelog');
  const versions = await getChangelog();

  const tagLabel: Record<ChangelogTag, string> = {
    new: t('tagNew'),
    improved: t('tagImproved'),
    fixed: t('tagFixed'),
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </header>

      {versions
        ? (
            <div className="space-y-6">
              {versions.map(version => (
                <Card
                  key={version.version}
                  id={`v${version.version}`}
                  className="scroll-mt-24 p-6"
                >
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <a
                      href={`#v${version.version}`}
                      className="font-medium transition-colors hover:text-foreground"
                    >
                      v
                      {version.version}
                    </a>
                    <span aria-hidden>·</span>
                    <time dateTime={version.date}>
                      {formatDate(version.date, locale)}
                    </time>
                  </div>

                  <p className="mb-5 text-base font-medium text-foreground">
                    {version.summary}
                  </p>

                  {version.highlights.length > 0 && (
                    <ul className="space-y-4">
                      {version.highlights.map((highlight, i) => (
                        <li
                          // eslint-disable-next-line react/no-array-index-key -- title is LLM output and can repeat within a release; the index disambiguates so React never drops a duplicate
                          key={`${version.version}-${i}`}
                          className="flex flex-col gap-1.5 sm:flex-row sm:gap-3"
                        >
                          <Badge
                            variant={highlight.tag}
                            className="h-fit w-fit shrink-0 sm:mt-0.5"
                          >
                            {tagLabel[highlight.tag]}
                          </Badge>
                          <div>
                            <p className="font-semibold text-foreground">
                              {highlight.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {highlight.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {version.underTheHood.length > 0 && (
                    <UnderTheHood
                      lines={version.underTheHood}
                      label={t('underTheHood')}
                      className={version.highlights.length > 0 ? 'mt-5' : ''}
                    />
                  )}
                </Card>
              ))}
            </div>
          )
        : (
            <div className="rounded-lg border border-border bg-muted p-8 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {t('noReleases')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t('noReleasesDescription')}
              </p>
            </div>
          )}
    </div>
  );
}
