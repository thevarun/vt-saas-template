import { expect, test } from '@playwright/test';

/**
 * SEO smoke suite — right-sized and browserless.
 *
 * These verify the one thing unit tests can't: that SEO artifacts survive the
 * full server-render pipeline into the real HTTP response. They use the
 * `request` fixture (no browser page) — an order of magnitude cheaper than
 * driving Chromium — because none of this needs a DOM. Generation/content
 * correctness of the underlying data lives in the co-located Vitest tests
 * (src/app/robots.test.ts, src/app/sitemap.test.ts, src/libs/seo/*).
 */

// Collect <link rel="alternate" hreflang="…"> entries from raw HTML,
// order-independent w.r.t. attribute order.
function hreflangLinks(html: string): { hreflang: string; href: string | undefined }[] {
  const out: { hreflang: string; href: string | undefined }[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel="alternate"/i.test(tag) || !/hreflang=/i.test(tag)) {
      continue;
    }
    out.push({
      hreflang: tag.match(/hreflang="([^"]+)"/i)?.[1] ?? '',
      href: tag.match(/href="([^"]+)"/i)?.[1],
    });
  }
  return out;
}

// Read a <meta> tag's content by a selector attribute (property/name),
// order-independent.
function metaContent(html: string, selector: 'property' | 'name', value: string): string | null {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if (new RegExp(`${selector}="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i').test(tag)) {
      return tag.match(/content="([^"]*)"/i)?.[1] ?? null;
    }
  }
  return null;
}

test.describe('SEO', () => {
  test('public page exposes hreflang alternates for every locale', async ({ request }) => {
    const html = await (await request.get('/en')).text();
    const links = hreflangLinks(html);
    const langs = links.map(l => l.hreflang);

    expect(langs).toEqual(expect.arrayContaining(['en', 'hi', 'bn', 'x-default']));

    // All alternates are absolute URLs.
    for (const { href } of links) {
      expect(href).toMatch(/^https?:\/\//);
    }

    // Default locale (en) and x-default are unprefixed (localePrefix: 'as-needed').
    for (const lang of ['en', 'x-default']) {
      expect(links.find(l => l.hreflang === lang)?.href).toMatch(/^https?:\/\/[^/]+\/?$/);
    }
  });

  test('localized page self-references its locale', async ({ request }) => {
    const html = await (await request.get('/hi')).text();
    const hi = hreflangLinks(html).find(l => l.hreflang === 'hi');

    expect(hi?.href).toContain('/hi');
  });

  test('landing page injects Open Graph and Twitter metadata', async ({ request }) => {
    const html = await (await request.get('/')).text();

    expect(metaContent(html, 'property', 'og:title')).toContain('VT SaaS Template');
    expect(metaContent(html, 'property', 'og:type')).toBe('website');
    expect(metaContent(html, 'property', 'og:site_name')).toBe('VT SaaS Template');
    expect(metaContent(html, 'property', 'og:url')).toMatch(/^https?:\/\//);
    expect(metaContent(html, 'property', 'og:image:width')).toBe('1200');
    expect(metaContent(html, 'property', 'og:image:height')).toBe('630');

    // OG image is an absolute URL pointing at the dynamic endpoint.
    const ogImage = metaContent(html, 'property', 'og:image');

    expect(ogImage).toMatch(/^https?:\/\//);
    expect(ogImage).toContain('/api/og');

    expect(metaContent(html, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(metaContent(html, 'name', 'twitter:title')).toContain('VT SaaS Template');
    expect(metaContent(html, 'name', 'twitter:image')).toMatch(/^https?:\/\//);
  });

  test('robots.txt disallows private routes and references the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');

    expect(res.headers()['content-type']).toContain('text/plain');

    const body = await res.text();

    expect(body).toContain('User-Agent: *');

    for (const route of ['/dashboard', '/admin', '/api', '/onboarding', '/chat', '/sign-out']) {
      expect(body).toContain(`Disallow: ${route}`);
    }

    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test('sitemap.xml lists public localized routes with absolute URLs and excludes private ones', async ({ request }) => {
    const res = await request.get('/sitemap.xml');

    expect(res.headers()['content-type']).toMatch(/xml/);

    const body = await res.text();

    expect(body).toContain('<urlset');
    expect(body).toContain('http://www.sitemaps.org/schemas/sitemap');
    expect(body).toContain('/hi');
    expect(body).toContain('/bn');

    const locs = [...body.matchAll(/<loc>(.+?)<\/loc>/g)].map(m => m[1]);

    expect(locs.length).toBeGreaterThanOrEqual(6);
    // Every entry is absolute; an unprefixed root (default locale) is present.
    expect(locs.every(url => /^https?:\/\//.test(url))).toBe(true);
    expect(locs.some(url => /^https?:\/\/[^/]+\/?$/.test(url))).toBe(true);

    // Private routes must not be indexed.
    for (const route of ['/dashboard', '/admin', '/onboarding', '/chat']) {
      expect(body).not.toContain(route);
    }

    expect(body).toContain('<lastmod>');
    expect(body).toContain('<priority>1</priority>');
  });

  test('dynamic OG image endpoint returns PNGs', async ({ request }) => {
    for (const url of ['/api/og', `/api/og?title=${encodeURIComponent('नमस्ते 🙏')}&description=Test`]) {
      const res = await request.get(url);

      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });
});
