# SEO

SEO utilities live in `src/libs/seo/` (hreflang, Open Graph, constants). Site URL is configured via `NEXT_PUBLIC_SITE_URL` (auto-detected on Vercel).

## Hreflang

Automatically added to all public pages via the root layout:

- Alternates for all locales: `en`, `hi`, `bn`
- `x-default` points to the English version
- Absolute URLs with the site domain

## Social metadata (Open Graph + Twitter Card)

- Default metadata set in the root layout (`src/app/[locale]/layout.tsx`)
- Page-specific overrides via `generateMetadata()`
- Utilities: `src/libs/seo/opengraph.ts`; constants: `src/libs/seo/constants.ts` (`DEFAULT_TITLE`, `DEFAULT_DESCRIPTION`, etc.)
- Default OG image: `public/og-image.png` (1200×630, static fallback)

### Adding social metadata to a page

```typescript
import type { Metadata } from 'next';
import { SITE_NAME } from '@/libs/seo/constants';
import { generateSocialMetadata } from '@/libs/seo/opengraph';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  const title = `Page Title | ${SITE_NAME}`;
  const description = 'Page-specific description for social sharing';

  return {
    title,
    description,
    ...generateSocialMetadata({
      title,
      description,
      path: `/${locale}/your-path`,
    }),
  };
}
```

Custom OG image (must be 1200×630):

```typescript
...generateSocialMetadata({
  title,
  description,
  image: '/custom-og-image.png',
  path: `/${locale}/your-path`,
})
```

## Dynamic OG images

Edge-generated at `/api/og` (`src/app/api/og/route.tsx`):

- Runs on Vercel Edge Runtime for fast worldwide generation
- Query params: `?title=Page+Title&description=Page+Description`
- Auto-used by `generateSocialMetadata()` when no custom image is provided
- Brand colors + Inter font, 1200×630 PNG output
- Falls back to static `/og-image.png` on generation failure
- Helper: `buildOgImageUrl()` from `src/libs/seo/opengraph.ts`

## robots.txt

Configured in `src/app/robots.ts`, generated at build time, served at `/robots.txt`:

- Allows all public pages by default (`Allow: /`)
- Disallows: `/dashboard`, `/admin`, `/api`, `/onboarding`, `/chat`, `/sign-out`, `/design-system`
- References the sitemap location with an absolute URL

Protected pages (dashboard, admin) also carry `noindex, nofollow` robots meta tags.

## Sitemap

XML sitemap in `src/app/sitemap.ts`, generated at build time, served at `/sitemap.xml`:

- Dynamically generated for all public pages, including localized versions (`en`, `hi`, `bn`)
- Absolute URLs with the domain
- Auto-updates on each deployment (no manual `sitemap.xml` editing)
- **Adding new public pages:** add the route to the `publicRoutes` array in `src/app/sitemap.ts` with an appropriate `priority` / `changeFrequency`

## Validation

- Sitemap: [XML Sitemaps Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- robots.txt: [Google Search Console Robots Tester](https://support.google.com/webmasters/answer/6062598)
- Submit the sitemap to Google Search Console after deployment
