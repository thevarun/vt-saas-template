import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/locales/en.json';

import ChangelogPage from './page';
import type { Changelog } from './types';

// Mock fs so getChangelog reads our fixture instead of docs/changelog.json.
const mockReadFile = vi.fn();
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
  },
}));

// getTranslations resolves keys from the real en.json Changelog namespace.
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => {
    const dict: Record<string, string>
      = namespace === 'Changelog' ? messages.Changelog : {};
    return (key: string) => dict[key] ?? `${namespace}.${key}`;
  },
}));

const fixture: Changelog = {
  versions: [
    {
      version: '1.2.0',
      date: '2026-03-01',
      summary: 'A release with a shiny new feature.',
      highlights: [
        {
          tag: 'new',
          title: 'Brand-new dashboard',
          body: 'See everything at a glance.',
        },
      ],
      underTheHood: ['Upgraded the runtime.'],
    },
  ],
};

async function renderPage() {
  // The page is an async server component — await its returned element.
  const ui = await ChangelogPage({ params: Promise.resolve({ locale: 'en' }) });
  return render(ui);
}

describe('ChangelogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders versions from changelog.json', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(fixture));

    await renderPage();

    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    expect(screen.getByText('A release with a shiny new feature.')).toBeInTheDocument();
    expect(screen.getByText('Brand-new dashboard')).toBeInTheDocument();
    // Tag label comes from the i18n namespace.
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows the empty state when there are no versions', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ versions: [] }));

    await renderPage();

    expect(screen.getByText(messages.Changelog.noReleases)).toBeInTheDocument();
    expect(
      screen.getByText(messages.Changelog.noReleasesDescription),
    ).toBeInTheDocument();
  });

  it('shows the empty state when the file is missing', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    await renderPage();

    expect(screen.getByText(messages.Changelog.noReleases)).toBeInTheDocument();
  });

  it('drops highlights whose tag is outside CHANGELOG_TAGS', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        versions: [
          {
            version: '1.3.0',
            date: '2026-04-01',
            summary: 'Mixed-tag release.',
            highlights: [
              { tag: 'new', title: 'Kept highlight', body: 'Valid tag.' },
              // An LLM-emitted tag outside the union must not render.
              { tag: 'totally-invalid', title: 'Dropped highlight', body: 'Bad tag.' },
            ],
            underTheHood: [],
          },
        ],
      }),
    );

    await renderPage();

    expect(screen.getByText('Kept highlight')).toBeInTheDocument();
    expect(screen.queryByText('Dropped highlight')).not.toBeInTheDocument();
  });
});
