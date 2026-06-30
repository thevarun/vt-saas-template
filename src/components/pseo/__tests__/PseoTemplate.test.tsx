import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PseoCategory, PseoPage } from '@/libs/pseo/data';
import { SITE_NAME } from '@/libs/seo/constants';

import { PseoTemplate } from '../PseoTemplate';

vi.mock('@/libs/seo/config', () => ({
  getSiteUrl: () => 'https://example.com',
}));

vi.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: ({ source }: { source: string }) => <div>{source}</div>,
}));

const shareWidgetUrls: string[] = [];
vi.mock('@/components/share', () => ({
  ShareWidget: ({ url }: { url: string }) => {
    shareWidgetUrls.push(url);
    return null;
  },
}));

vi.mock('../Breadcrumbs', () => ({
  Breadcrumbs: () => null,
}));

vi.mock('../RelatedPages', () => ({
  RelatedPages: () => null,
}));

vi.mock('../mdx-components', () => ({
  mdxComponents: {},
}));

const mockCategory: PseoCategory = {
  id: 'productivity',
  name: 'Productivity',
  description: 'Productivity articles',
  slug: 'productivity',
};

const mockPage: PseoPage = {
  id: 'hello-world',
  categoryId: 'productivity',
  slug: 'hello-world',
  title: 'Hello, World',
  description: 'A friendly intro article',
  content: 'Body text',
  keywords: ['hello', 'world'],
  lastModified: '2026-05-01',
};

function getArticleSchema(container: HTMLElement) {
  const scripts = Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  );
  const articleScript = scripts.find(s =>
    s.textContent?.includes('"@type":"Article"'),
  );
  return articleScript ? JSON.parse(articleScript.textContent || '{}') : null;
}

describe('PseoTemplate Article JSON-LD', () => {
  it('emits an Article JSON-LD script with required fields', () => {
    const { container } = render(
      <PseoTemplate
        page={mockPage}
        category={mockCategory}
        relatedPages={[]}
        locale="en"
      />,
    );

    const schema = getArticleSchema(container);

    expect(schema).not.toBeNull();
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe('Hello, World');
    expect(schema.description).toBe('A friendly intro article');
    expect(schema.datePublished).toBe('2026-05-01');
    expect(schema.dateModified).toBe('2026-05-01');
    expect(schema.author).toEqual({
      '@type': 'Organization',
      'name': SITE_NAME,
    });
    expect(schema.publisher).toEqual({
      '@type': 'Organization',
      'name': SITE_NAME,
    });
  });

  it('renders the MDX body source', () => {
    const { container } = render(
      <PseoTemplate
        page={mockPage}
        category={mockCategory}
        relatedPages={[]}
        locale="en"
      />,
    );

    expect(container.textContent).toContain('Body text');
  });

  it('uses an unprefixed canonical URL for the default locale', () => {
    const { container } = render(
      <PseoTemplate
        page={mockPage}
        category={mockCategory}
        relatedPages={[]}
        locale="en"
      />,
    );
    const schema = getArticleSchema(container);

    expect(schema.mainEntityOfPage['@id']).toBe(
      'https://example.com/blog/productivity/hello-world',
    );
  });

  it('uses a locale-prefixed canonical URL for non-default locales', () => {
    const { container } = render(
      <PseoTemplate
        page={mockPage}
        category={mockCategory}
        relatedPages={[]}
        locale="hi"
      />,
    );
    const schema = getArticleSchema(container);

    expect(schema.mainEntityOfPage['@id']).toBe(
      'https://example.com/hi/blog/productivity/hello-world',
    );
  });

  it('passes an absolute URL to ShareWidget (not a relative path)', () => {
    shareWidgetUrls.length = 0;
    render(
      <PseoTemplate
        page={mockPage}
        category={mockCategory}
        relatedPages={[]}
        locale="en"
      />,
    );

    expect(shareWidgetUrls).toHaveLength(1);
    expect(shareWidgetUrls[0]).toBe(
      'https://example.com/blog/productivity/hello-world',
    );
  });

  it('escapes `<` in JSON-LD so frontmatter cannot break out of the script tag', () => {
    const { container } = render(
      <PseoTemplate
        page={{ ...mockPage, title: 'Evil</script><script>alert(1)</script>' }}
        category={mockCategory}
        relatedPages={[]}
        locale="en"
      />,
    );

    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    );
    const articleScript = scripts.find(s =>
      s.innerHTML.includes('"@type":"Article"'),
    );

    expect(articleScript?.innerHTML).not.toContain('</script>');
    expect(articleScript?.innerHTML).toContain('\\u003c');

    // The parsed payload still carries the original (un-escaped) value.
    const parsed = JSON.parse(articleScript?.textContent ?? '{}');

    expect(parsed.headline).toBe('Evil</script><script>alert(1)</script>');
  });
});
