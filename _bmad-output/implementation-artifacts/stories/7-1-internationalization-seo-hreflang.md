# Story 7.1: Internationalization SEO (hreflang)

Status: ready-for-dev

## Story

As a search engine crawler,
I want to understand language variants of pages,
so that users are shown the right language version in search results.

## Acceptance Criteria

### AC1: Hreflang Tags Present on Public Pages
**Given** any public page on the site
**When** I view the page source
**Then** I see hreflang link tags for all supported languages
**And** tags include: en, hi, bn (all supported locales)
**And** tags include x-default pointing to English version

### AC2: Hreflang Implementation via Next.js Metadata API
**Given** the hreflang implementation
**When** I review the code
**Then** alternates are configured in layout.tsx or page metadata
**And** Next.js Metadata API is used correctly
**And** URLs are absolute (including domain)

### AC3: Landing Page Hreflang Tags
**Given** the landing page at /en
**When** I inspect hreflang tags
**Then** I see `<link rel="alternate" hreflang="en" href="https://example.com/en" />`
**And** I see `<link rel="alternate" hreflang="hi" href="https://example.com/hi" />`
**And** I see `<link rel="alternate" hreflang="bn" href="https://example.com/bn" />`
**And** I see `<link rel="alternate" hreflang="x-default" href="https://example.com/en" />`

### AC4: Localized Page Hreflang Tags
**Given** any localized page (e.g., /hi/about)
**When** I check hreflang tags
**Then** alternates point to correct localized versions
**And** self-referential hreflang is included
**And** URLs match actual page paths

### AC5: Protected Pages Excluded
**Given** authenticated pages (dashboard, settings, admin)
**When** I check for hreflang
**Then** hreflang tags are NOT present (or pages are noindex)
**And** only public pages have language alternates

## Tasks / Subtasks

- [ ] Task 1: Create site URL configuration utility (AC: #2, #3, #4)
  - [ ] Subtask 1.1: Create `src/libs/seo/config.ts` for site URL configuration
  - [ ] Subtask 1.2: Implement `getSiteUrl()` function that returns absolute site URL
  - [ ] Subtask 1.3: Use `NEXT_PUBLIC_SITE_URL` env var if set, otherwise construct from Vercel env vars
  - [ ] Subtask 1.4: Fallback to `http://localhost:3000` in development if no env vars
  - [ ] Subtask 1.5: Add TypeScript types for site URL configuration
  - [ ] Subtask 1.6: Export AllLocales from AppConfig for reuse

- [ ] Task 2: Create hreflang generation utility (AC: #1, #2, #3, #4)
  - [ ] Subtask 2.1: Create `src/libs/seo/hreflang.ts` for hreflang link generation
  - [ ] Subtask 2.2: Implement `generateHreflangLinks(pathname: string)` function
  - [ ] Subtask 2.3: Generate alternate links for all supported locales (en, hi, bn)
  - [ ] Subtask 2.4: Include x-default pointing to English (/en) version
  - [ ] Subtask 2.5: Use absolute URLs with site domain from getSiteUrl()
  - [ ] Subtask 2.6: Strip locale prefix from pathname before reconstructing
  - [ ] Subtask 2.7: Return array of { hreflang: string, href: string } objects
  - [ ] Subtask 2.8: Add TypeScript types for hreflang link objects

- [ ] Task 3: Update root layout with hreflang metadata (AC: #1, #2, #3)
  - [ ] Subtask 3.1: Update `src/app/[locale]/layout.tsx` to add alternates metadata
  - [ ] Subtask 3.2: Import generateHreflangLinks utility
  - [ ] Subtask 3.3: Generate metadata using generateMetadata() async function
  - [ ] Subtask 3.4: Extract locale and pathname from params
  - [ ] Subtask 3.5: Call generateHreflangLinks(pathname) to get alternate links
  - [ ] Subtask 3.6: Map hreflang links to Next.js Metadata alternates.languages format
  - [ ] Subtask 3.7: Merge with existing metadata (icons)
  - [ ] Subtask 3.8: Ensure absolute URLs are used in all alternates

- [ ] Task 4: Add hreflang to public pages (AC: #4)
  - [ ] Subtask 4.1: Verify landing page (`src/app/[locale]/page.tsx`) uses root layout
  - [ ] Subtask 4.2: Test that landing page generates hreflang tags correctly
  - [ ] Subtask 4.3: Add page-specific metadata to override if needed (title, description)
  - [ ] Subtask 4.4: Verify hreflang works for nested public pages (/about, /pricing, etc.)
  - [ ] Subtask 4.5: Ensure self-referential hreflang is always included

- [ ] Task 5: Exclude hreflang from protected pages (AC: #5)
  - [ ] Subtask 5.1: Review protected route layouts: `(auth)/layout.tsx`, `(admin)/layout.tsx`
  - [ ] Subtask 5.2: Add robots metadata to protected layouts: `{ robots: 'noindex, nofollow' }`
  - [ ] Subtask 5.3: Test that /dashboard does not have hreflang tags
  - [ ] Subtask 5.4: Test that /admin does not have hreflang tags
  - [ ] Subtask 5.5: Verify noindex meta tag is present on protected pages

- [ ] Task 6: Add NEXT_PUBLIC_SITE_URL environment variable (AC: #2, #3, #4)
  - [ ] Subtask 6.1: Add `NEXT_PUBLIC_SITE_URL` to `.env.example` with example value
  - [ ] Subtask 6.2: Document env var in `CLAUDE.md` under Environment Variables section
  - [ ] Subtask 6.3: Update `.github/workflows` if needed to include env var in CI
  - [ ] Subtask 6.4: Add comment explaining Vercel auto-detection fallback
  - [ ] Subtask 6.5: Test with and without env var to ensure fallback works

- [ ] Task 7: Write utility tests (AC: #1-#4)
  - [ ] Subtask 7.1: Create `src/libs/seo/hreflang.test.ts`
  - [ ] Subtask 7.2: Test generateHreflangLinks() returns correct number of links (4: en, hi, bn, x-default)
  - [ ] Subtask 7.3: Test x-default points to English version
  - [ ] Subtask 7.4: Test locale prefix is correctly added to each alternate
  - [ ] Subtask 7.5: Test pathname is preserved in alternates (e.g., /about → /en/about)
  - [ ] Subtask 7.6: Test URLs are absolute with domain
  - [ ] Subtask 7.7: Test with various pathname patterns (/, /about, /pricing/plans)
  - [ ] Subtask 7.8: Mock getSiteUrl() to return consistent test domain

- [ ] Task 8: Add E2E test for hreflang presence (AC: #1, #3)
  - [ ] Subtask 8.1: Create `tests/seo-hreflang.spec.ts` or add to existing SEO test
  - [ ] Subtask 8.2: Navigate to landing page
  - [ ] Subtask 8.3: Extract hreflang link tags from page HTML
  - [ ] Subtask 8.4: Verify 4 hreflang links present (en, hi, bn, x-default)
  - [ ] Subtask 8.5: Verify URLs are absolute and contain correct locales
  - [ ] Subtask 8.6: Verify x-default points to /en
  - [ ] Subtask 8.7: Test with multiple pages (landing, about, etc.)

- [ ] Task 9: Test protected pages exclusion (AC: #5)
  - [ ] Subtask 9.1: Add test in `tests/seo-hreflang.spec.ts` for protected routes
  - [ ] Subtask 9.2: Sign in as test user
  - [ ] Subtask 9.3: Navigate to /dashboard
  - [ ] Subtask 9.4: Verify NO hreflang tags are present
  - [ ] Subtask 9.5: Verify noindex meta tag is present
  - [ ] Subtask 9.6: Repeat for /admin route (if admin user)

- [ ] Task 10: Add documentation (AC: #2)
  - [ ] Subtask 10.1: Add hreflang section to `CLAUDE.md` under SEO or Architecture
  - [ ] Subtask 10.2: Document how to add hreflang to new public pages
  - [ ] Subtask 10.3: Document NEXT_PUBLIC_SITE_URL configuration
  - [ ] Subtask 10.4: Add examples of metadata configuration
  - [ ] Subtask 10.5: Document public vs protected page SEO strategy

## Dev Notes

### Technical Implementation Overview

Story 7.1 implements internationalization SEO by adding hreflang tags to all public pages. This tells search engines which language variants exist for each page, improving SEO for multilingual sites.

**Key Concepts:**
- **hreflang tags**: Link elements that declare language alternates
- **x-default**: Default language for users who don't speak any of the available languages
- **Next.js Metadata API**: Type-safe way to generate meta tags in Next.js 15

### Critical Architecture Requirements

**Site URL Configuration:**

The site URL must be absolute for hreflang tags to work. Priority order:
1. `NEXT_PUBLIC_SITE_URL` env var (if set)
2. Vercel environment variables (`VERCEL_URL` with https://)
3. `http://localhost:3000` (development fallback)

**Implementation Pattern:**

```typescript
// src/libs/seo/config.ts
export function getSiteUrl(): string {
  // Explicit override
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Vercel auto-detection
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development fallback
  return 'http://localhost:3000';
}
```

**Hreflang Link Generation:**

```typescript
// src/libs/seo/hreflang.ts
import { AllLocales, AppConfig } from '@/utils/AppConfig';
import { getSiteUrl } from './config';

interface HreflangLink {
  hreflang: string;
  href: string;
}

export function generateHreflangLinks(pathname: string): HreflangLink[] {
  const siteUrl = getSiteUrl();

  // Strip existing locale prefix if present
  const cleanPathname = pathname.replace(/^\/(en|hi|bn)(\/|$)/, '/');

  // Generate alternate for each locale
  const links: HreflangLink[] = AllLocales.map((locale) => ({
    hreflang: locale,
    href: `${siteUrl}/${locale}${cleanPathname === '/' ? '' : cleanPathname}`,
  }));

  // Add x-default pointing to English
  links.push({
    hreflang: 'x-default',
    href: `${siteUrl}/${AppConfig.defaultLocale}${cleanPathname === '/' ? '' : cleanPathname}`,
  });

  return links;
}
```

**Root Layout Metadata Integration:**

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { generateHreflangLinks } from '@/libs/seo/hreflang';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  // Get current pathname (will be implemented via headers)
  const pathname = '/'; // Simplified for root layout

  // Generate hreflang links
  const hreflangLinks = generateHreflangLinks(pathname);

  // Convert to Next.js Metadata format
  const alternates = {
    languages: hreflangLinks.reduce((acc, link) => {
      acc[link.hreflang] = link.href;
      return acc;
    }, {} as Record<string, string>),
  };

  return {
    alternates,
    icons: [
      // ... existing icon metadata
    ],
  };
}
```

**Protected Page Exclusion:**

```typescript
// src/app/[locale]/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

### Next.js 15 Specifics

**Async Params:**
- In Next.js 15, `params` is a Promise that must be awaited
- Pattern: `const { locale } = await props.params`

**Metadata API:**
- Use `generateMetadata()` async function for dynamic metadata
- Return type: `Promise<Metadata>`
- Merges with parent layout metadata automatically

**Alternates Configuration:**
- `alternates.languages` object maps hreflang to URL
- Example: `{ 'en': 'https://example.com/en', 'x-default': 'https://example.com/en' }`
- Next.js automatically generates `<link rel="alternate">` tags

### Localization Context

**Existing Locales:**
- English (en) - Default
- Hindi (hi) - हिन्दी
- Bengali (bn) - বাংলা

**Locale Configuration:**
- Defined in `src/utils/AppConfig.ts`
- Exported as `AllLocales` array: `['en', 'hi', 'bn']`
- Default locale: `'en'`

**URL Structure:**
- `next-intl` with `as-needed` prefix mode
- Default locale (/en/) may or may not have prefix depending on config
- All pages use `[locale]` dynamic segment

**Protected vs Public Pages:**
- Public: `(unauth)` route group - needs hreflang
- Protected: `(auth)` and `(admin)` route groups - NO hreflang, add noindex

### Implementation Strategy

**Phase 1: Site URL Configuration**
1. Create `src/libs/seo/config.ts`
2. Implement `getSiteUrl()` with environment variable priority
3. Add `NEXT_PUBLIC_SITE_URL` to `.env.example`
4. Test fallback behavior

**Phase 2: Hreflang Utility**
1. Create `src/libs/seo/hreflang.ts`
2. Implement `generateHreflangLinks(pathname: string)`
3. Handle locale prefix stripping
4. Generate alternates for all locales + x-default
5. Write unit tests

**Phase 3: Root Layout Integration**
1. Update `src/app/[locale]/layout.tsx`
2. Add `generateMetadata()` async function
3. Generate hreflang links
4. Convert to Next.js Metadata alternates format
5. Merge with existing metadata

**Phase 4: Protected Pages**
1. Update `src/app/[locale]/(auth)/layout.tsx`
2. Update `src/app/[locale]/(admin)/layout.tsx`
3. Add `robots: { index: false, follow: false }`
4. Test noindex tag presence

**Phase 5: Testing & Documentation**
1. Write unit tests for hreflang generation
2. Write E2E tests for tag presence
3. Test protected page exclusion
4. Update CLAUDE.md with SEO patterns
5. Document env var configuration

### Testing Strategy

**Unit Tests:**

```typescript
// src/libs/seo/hreflang.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateHreflangLinks } from './hreflang';
import * as config from './config';

describe('generateHreflangLinks', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  it('generates links for all locales', () => {
    const links = generateHreflangLinks('/');

    expect(links).toHaveLength(4); // en, hi, bn, x-default
    expect(links.map(l => l.hreflang)).toEqual(['en', 'hi', 'bn', 'x-default']);
  });

  it('includes x-default pointing to English', () => {
    const links = generateHreflangLinks('/');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    expect(xDefault?.href).toBe('https://example.com/en');
  });

  it('preserves pathname in alternates', () => {
    const links = generateHreflangLinks('/about');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/en/about');
  });

  it('strips existing locale prefix', () => {
    const links = generateHreflangLinks('/hi/about');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/en/about');
  });

  it('uses absolute URLs', () => {
    const links = generateHreflangLinks('/');

    links.forEach(link => {
      expect(link.href).toMatch(/^https?:\/\//);
    });
  });
});
```

**E2E Tests:**

```typescript
// tests/seo-hreflang.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SEO - Hreflang Tags', () => {
  test('landing page has hreflang tags', async ({ page }) => {
    await page.goto('/');

    // Get all hreflang link tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    // Should have 4 links (en, hi, bn, x-default)
    expect(hreflangLinks).toHaveLength(4);

    // Extract hreflang values
    const hreflangValues = await Promise.all(
      hreflangLinks.map(link => link.getAttribute('hreflang'))
    );

    expect(hreflangValues).toContain('en');
    expect(hreflangValues).toContain('hi');
    expect(hreflangValues).toContain('bn');
    expect(hreflangValues).toContain('x-default');

    // Verify x-default points to English
    const xDefaultLink = hreflangLinks.find(
      async link => (await link.getAttribute('hreflang')) === 'x-default'
    );
    const xDefaultHref = await xDefaultLink?.getAttribute('href');
    expect(xDefaultHref).toContain('/en');
  });

  test('protected pages do not have hreflang tags', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should NOT have hreflang tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();
    expect(hreflangLinks).toHaveLength(0);

    // Should have noindex meta tag
    const noindexMeta = await page.locator('meta[name="robots"][content*="noindex"]').first();
    expect(noindexMeta).toBeTruthy();
  });
});
```

### Edge Cases & Considerations

**1. Development vs Production URLs:**
- In development, hreflang will use `http://localhost:3000`
- In production, use `NEXT_PUBLIC_SITE_URL` or Vercel auto-detection
- Google Search Console may show warnings for localhost URLs (expected)

**2. Custom Domains:**
- If using custom domain, MUST set `NEXT_PUBLIC_SITE_URL` env var
- Vercel URL (*.vercel.app) may not match custom domain
- Example: `NEXT_PUBLIC_SITE_URL=https://www.example.com`

**3. Trailing Slashes:**
- Be consistent: either always include or always exclude trailing slashes
- Next.js default: no trailing slashes
- Current implementation: no trailing slash on root, paths as-is

**4. Route Groups:**
- `(unauth)`, `(auth)`, `(admin)` don't affect URL structure
- Pathname should NOT include route group names
- Example: `/dashboard` not `/(auth)/dashboard`

**5. Dynamic Routes:**
- For now, only static public pages need hreflang
- Dynamic routes (/blog/[slug]) can add hreflang in page metadata
- Future enhancement: dynamic hreflang for blog posts, products, etc.

**6. API Routes:**
- API routes don't need hreflang (not HTML pages)
- Middleware already excludes `/api/*` from locale routing

**7. Sitemap Integration:**
- Hreflang should align with sitemap entries (Story 7.3)
- Both should list same public pages with locales
- Future: reference sitemap in hreflang validation

### Environment Variables

Add to `.env.example`:

```bash
# Site URL (required for SEO - hreflang, Open Graph, sitemaps)
# In development: defaults to http://localhost:3000
# On Vercel: auto-detected from VERCEL_URL
# For custom domains: set explicitly
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

**Documentation for CLAUDE.md:**

```markdown
### SEO Configuration

**Site URL (hreflang, Open Graph, sitemaps):**
- Set `NEXT_PUBLIC_SITE_URL` for production custom domains
- On Vercel, auto-detects from `VERCEL_URL` if not set
- Development fallback: `http://localhost:3000`

**Hreflang Tags:**
- Automatically added to all public pages (root layout)
- Includes alternates for all locales: en, hi, bn
- Includes x-default pointing to English version
- Protected pages (`/dashboard`, `/admin`) excluded via noindex
```

### Project Structure

**New Files:**
```
src/
  libs/
    seo/
      config.ts                 # Site URL configuration
      config.test.ts            # Config tests
      hreflang.ts               # Hreflang link generation
      hreflang.test.ts          # Hreflang tests
tests/
  seo-hreflang.spec.ts          # E2E tests for hreflang presence
```

**Updated Files:**
```
src/
  app/[locale]/
    layout.tsx                  # Add generateMetadata with alternates
  app/[locale]/(auth)/
    layout.tsx                  # Add noindex metadata
  app/[locale]/(admin)/
    layout.tsx                  # Add noindex metadata
.env.example                    # Add NEXT_PUBLIC_SITE_URL
CLAUDE.md                       # Add SEO documentation
```

**Import Pattern:**
```typescript
import { getSiteUrl } from '@/libs/seo/config'
import { generateHreflangLinks } from '@/libs/seo/hreflang'
```

### References

- [Source: Epic 7 Story 7.1] - Full acceptance criteria
- [Source: src/utils/AppConfig.ts] - Locale configuration
- [Source: src/middleware.ts] - Locale routing and protected paths
- [Source: src/app/[locale]/layout.tsx] - Current root layout
- [Source: CLAUDE.md#Internationalization] - i18n patterns
- [Next.js Metadata API Docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google Hreflang Guidelines](https://developers.google.com/search/docs/specialty/international/localized-versions)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** pending
**Date:**
**Full Report:**

### Verification Summary
