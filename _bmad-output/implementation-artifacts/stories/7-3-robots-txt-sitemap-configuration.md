# Story 7.3: Robots.txt & Sitemap Configuration

Status: ready-for-dev

## Story

As a search engine crawler,
I want clear indexing instructions,
so that I index public pages and avoid private ones.

## Acceptance Criteria

### AC1: Robots.txt Content and Format
**Given** robots.txt at /robots.txt
**When** I view the file
**Then** it allows crawling of public pages
**And** it disallows /dashboard, /admin, /api paths
**And** it references the sitemap location
**And** format follows standard robots.txt spec

### AC2: Robots.txt Rules Validation
**Given** the robots.txt content
**When** I review the rules
**Then** I see `User-agent: *`
**And** I see `Allow: /`
**And** I see `Disallow: /dashboard`
**And** I see `Disallow: /admin`
**And** I see `Disallow: /api`
**And** I see `Sitemap: https://example.com/sitemap.xml`

### AC3: Sitemap XML Structure and Content
**Given** the sitemap at /sitemap.xml
**When** I view the sitemap
**Then** it lists all public pages
**And** it includes localized versions of pages
**And** each URL has lastmod, changefreq (optional)
**And** format is valid XML sitemap

### AC4: Sitemap Implementation Pattern
**Given** the sitemap implementation
**When** I review the code
**Then** sitemap is generated via `src/app/sitemap.ts`
**And** sitemap is dynamically generated (not static file)
**And** new public pages are automatically included

### AC5: Private Route Exclusion
**Given** authenticated routes
**When** I check the sitemap
**Then** /dashboard, /admin, /settings are NOT listed
**And** only publicly accessible pages are included

### AC6: Localized Sitemap Entries
**Given** localized pages in sitemap
**When** I review entries
**Then** each page appears with all locale variants
**And** alternates are properly linked
**And** URLs are absolute with domain

## Tasks / Subtasks

- [ ] Task 1: Enhance robots.ts with comprehensive rules (AC: #1, #2)
  - [ ] Subtask 1.1: Review existing `src/app/robots.ts`
  - [ ] Subtask 1.2: Import getSiteUrl() from @/libs/seo/config
  - [ ] Subtask 1.3: Add Disallow rules for /dashboard/* (all auth routes)
  - [ ] Subtask 1.4: Add Disallow rule for /admin/* (all admin routes)
  - [ ] Subtask 1.5: Add Disallow rule for /api/* (all API endpoints)
  - [ ] Subtask 1.6: Add Disallow rule for /onboarding (auth-only)
  - [ ] Subtask 1.7: Add Disallow rule for /chat/* (auth-only)
  - [ ] Subtask 1.8: Verify sitemap URL uses getSiteUrl() for absolute path
  - [ ] Subtask 1.9: Test robots.txt output at /robots.txt endpoint

- [ ] Task 2: Enhance sitemap.ts with all public routes (AC: #3, #4, #5, #6)
  - [ ] Subtask 2.1: Review existing `src/app/sitemap.ts`
  - [ ] Subtask 2.2: Import getSiteUrl() from @/libs/seo/config
  - [ ] Subtask 2.3: Import AppConfig (locales) from @/utils/AppConfig
  - [ ] Subtask 2.4: Define public routes array: ['/'] (landing page)
  - [ ] Subtask 2.5: For each public route, generate entries for all locales
  - [ ] Subtask 2.6: Set lastModified to new Date() for all entries
  - [ ] Subtask 2.7: Set changeFrequency appropriately (daily for home, weekly for static)
  - [ ] Subtask 2.8: Set priority (1.0 for home, 0.8-0.5 for other pages)
  - [ ] Subtask 2.9: Ensure all URLs are absolute (include getSiteUrl())
  - [ ] Subtask 2.10: Test sitemap.xml output at /sitemap.xml endpoint

- [ ] Task 3: Add utility for generating localized sitemap URLs (AC: #6)
  - [ ] Subtask 3.1: Create helper function `generateLocalizedUrls(path: string)`
  - [ ] Subtask 3.2: Accept base path like '/' or '/about'
  - [ ] Subtask 3.3: Return array of sitemap entries for all locales
  - [ ] Subtask 3.4: Each entry includes url, lastModified, changeFrequency, priority
  - [ ] Subtask 3.5: Use AppConfig.locales for locale iteration
  - [ ] Subtask 3.6: Format URLs as `${getSiteUrl()}/${locale}${path}`
  - [ ] Subtask 3.7: Add TypeScript types for return value
  - [ ] Subtask 3.8: Export from sitemap.ts for reuse

- [ ] Task 4: Document public vs private route strategy (AC: #4, #5)
  - [ ] Subtask 4.1: Add comment in sitemap.ts explaining route classification
  - [ ] Subtask 4.2: Document which routes are public (landing page, future: about, pricing)
  - [ ] Subtask 4.3: Document which routes are excluded (auth, admin, API)
  - [ ] Subtask 4.4: Add note about future dynamic routes (blog posts, docs)
  - [ ] Subtask 4.5: Explain how to add new public routes to sitemap

- [ ] Task 5: Write unit tests for sitemap helper (AC: #6)
  - [ ] Subtask 5.1: Create `src/app/sitemap.test.ts`
  - [ ] Subtask 5.2: Test generateLocalizedUrls() returns correct locale count
  - [ ] Subtask 5.3: Test URLs are absolute with correct locale prefix
  - [ ] Subtask 5.4: Test each entry has required fields (url, lastModified, etc.)
  - [ ] Subtask 5.5: Mock getSiteUrl() to return consistent test domain
  - [ ] Subtask 5.6: Test priority values are reasonable (0.0-1.0)
  - [ ] Subtask 5.7: Test changeFrequency values are valid enum values

- [ ] Task 6: Add E2E test for robots.txt (AC: #1, #2)
  - [ ] Subtask 6.1: Create `tests/seo-robots-sitemap.spec.ts`
  - [ ] Subtask 6.2: Navigate to /robots.txt
  - [ ] Subtask 6.3: Verify response is text/plain content type
  - [ ] Subtask 6.4: Parse robots.txt content
  - [ ] Subtask 6.5: Assert 'User-agent: *' is present
  - [ ] Subtask 6.6: Assert 'Allow: /' is present
  - [ ] Subtask 6.7: Assert 'Disallow: /dashboard' is present
  - [ ] Subtask 6.8: Assert 'Disallow: /admin' is present
  - [ ] Subtask 6.9: Assert 'Disallow: /api' is present
  - [ ] Subtask 6.10: Assert sitemap URL is present and absolute

- [ ] Task 7: Add E2E test for sitemap.xml (AC: #3, #5, #6)
  - [ ] Subtask 7.1: Add test to same spec file
  - [ ] Subtask 7.2: Navigate to /sitemap.xml
  - [ ] Subtask 7.3: Verify response is application/xml content type
  - [ ] Subtask 7.4: Parse XML content
  - [ ] Subtask 7.5: Assert urlset namespace is correct
  - [ ] Subtask 7.6: Count URL entries (should be: public routes × locale count)
  - [ ] Subtask 7.7: Verify each URL is absolute (starts with http)
  - [ ] Subtask 7.8: Verify all locales are present (en, hi, bn)
  - [ ] Subtask 7.9: Assert no auth routes (/dashboard, /admin) are listed
  - [ ] Subtask 7.10: Assert each entry has lastmod element

- [ ] Task 8: Manual validation with Google Search Console (AC: #1, #3)
  - [ ] Subtask 8.1: Deploy to preview or staging environment
  - [ ] Subtask 8.2: Test robots.txt in browser (view raw file)
  - [ ] Subtask 8.3: Test sitemap.xml in browser (view XML)
  - [ ] Subtask 8.4: Validate sitemap with online validator (xml-sitemaps.com/validate-xml-sitemap.html)
  - [ ] Subtask 8.5: Check for XML syntax errors
  - [ ] Subtask 8.6: Verify all URLs are accessible (200 status)
  - [ ] Subtask 8.7: Document validation results in completion notes

- [ ] Task 9: Add documentation to CLAUDE.md (AC: #4)
  - [ ] Subtask 9.1: Add "SEO Configuration" section to CLAUDE.md
  - [ ] Subtask 9.2: Document robots.txt configuration and rules
  - [ ] Subtask 9.3: Document sitemap.xml generation approach
  - [ ] Subtask 9.4: Explain how to add new public routes to sitemap
  - [ ] Subtask 9.5: Document locale handling in sitemap
  - [ ] Subtask 9.6: Add link to sitemap validation tools
  - [ ] Subtask 9.7: Note that sitemap auto-regenerates on deploy

## Dev Notes

### Technical Implementation Overview

Story 7.3 enhances the existing robots.txt and sitemap.xml files to properly guide search engine crawlers. The robots.txt file explicitly disallows authenticated and admin routes while allowing public pages. The sitemap.xml dynamically generates entries for all public pages across all supported locales (en, hi, bn).

**Key Concepts:**
- **robots.txt**: Text file that tells crawlers which pages to crawl/skip
- **Disallow**: Directive that blocks crawlers from specific paths
- **sitemap.xml**: XML file listing all public URLs for efficient crawling
- **Next.js Route Handlers**: Files like `robots.ts` and `sitemap.ts` in app directory

**Important Context:**
- Both `src/app/robots.ts` and `src/app/sitemap.ts` ALREADY EXIST
- Story 7.1 created SEO utilities at `src/libs/seo/` including `getSiteUrl()`
- Current implementation is minimal - needs enhancement with proper rules/routes
- App uses next-intl with locales: en, hi, bn (from AppConfig)

### Critical Architecture Requirements

**Next.js App Router Conventions:**

Next.js 15 provides special route handlers for SEO files:
- `src/app/robots.ts` → generates `/robots.txt`
- `src/app/sitemap.ts` → generates `/sitemap.xml`

These files export functions that return typed objects. Next.js automatically converts them to proper text/XML formats.

**Robots.txt Pattern:**

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/libs/seo/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/api', '/onboarding', '/chat'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
```

**Sitemap Pattern:**

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/libs/seo/config'
import { AppConfig } from '@/utils/AppConfig'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const locales = AppConfig.locales

  // Define public routes
  const publicRoutes = ['/']

  // Generate localized entries
  const entries: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${route === '/' ? '' : route}`,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1.0 : 0.8,
      })
    }
  }

  return entries
}
```

**Absolute URL Requirement:**

Both robots.txt sitemap reference and sitemap.xml URLs MUST be absolute. Use `getSiteUrl()` from Story 7.1.

### Implementation Strategy

**Phase 1: Enhance robots.ts**

Current implementation only has basic Allow: / rule. Needs comprehensive Disallow rules:

```typescript
import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/libs/seo/config'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',    // All dashboard routes
        '/admin',        // All admin panel routes
        '/api',          // All API endpoints
        '/onboarding',   // Onboarding wizard (auth-only)
        '/chat',         // Chat interface (auth-only)
        '/sign-out',     // Sign out page (auth-only)
        '/design-system', // Design system (internal)
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

**Why Disallow These Routes:**
- `/dashboard` - Authenticated user area, no SEO value
- `/admin` - Admin panel, should never be indexed
- `/api` - API endpoints, not HTML pages
- `/onboarding` - User-specific wizard, no public value
- `/chat` - Private conversations, no SEO value
- `/sign-out` - Utility page, no content
- `/design-system` - Internal design reference, not for public

**Phase 2: Enhance sitemap.ts**

Current implementation has single hardcoded entry. Needs locale-aware generation:

```typescript
import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/libs/seo/config'
import { AppConfig } from '@/utils/AppConfig'

/**
 * Generate sitemap entries for a route across all locales
 */
function generateLocalizedUrls(
  path: string,
  options: {
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
  } = {},
): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const { changeFrequency = 'weekly', priority = 0.8 } = options

  return AppConfig.locales.map((locale) => ({
    url: `${siteUrl}/${locale}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Public routes that should be indexed
  const publicRoutes: Array<{
    path: string
    changeFrequency?: MetadataRoute.Sitemap[0]['changeFrequency']
    priority?: number
  }> = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    // Future: Add /about, /pricing, /blog, etc.
  ]

  // Generate localized entries for all public routes
  const entries: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    entries.push(...generateLocalizedUrls(route.path, {
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))
  }

  return entries
}
```

**Expected Output:**

With 3 locales (en, hi, bn) and 1 public route (/), sitemap will have 3 entries:
- `https://example.com/en` (priority: 1.0, changeFreq: daily)
- `https://example.com/hi` (priority: 1.0, changeFreq: daily)
- `https://example.com/bn` (priority: 1.0, changeFreq: daily)

**Phase 3: Helper Function Design**

Extract `generateLocalizedUrls()` as reusable helper within sitemap.ts:

```typescript
/**
 * Generate sitemap entries for a route across all supported locales
 *
 * @param path - Route path (e.g., '/', '/about', '/pricing')
 * @param options - Sitemap options (changeFrequency, priority)
 * @returns Array of sitemap entries (one per locale)
 */
function generateLocalizedUrls(
  path: string,
  options: {
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
  } = {},
): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const { changeFrequency = 'weekly', priority = 0.8 } = options

  return AppConfig.locales.map((locale) => ({
    url: `${siteUrl}/${locale}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
```

**Why This Design:**
- Encapsulates locale iteration logic
- Consistent URL formatting across all routes
- Easy to add new routes with different priorities
- Type-safe with Next.js MetadataRoute types

**Phase 4: Route Classification**

Document which routes are public vs private:

```typescript
// PUBLIC ROUTES (include in sitemap):
// - / (landing page)
// - /about (future)
// - /pricing (future)
// - /blog/[slug] (future - dynamic)
// - /docs/[...slug] (future - dynamic)

// PRIVATE ROUTES (exclude from sitemap, disallow in robots.txt):
// - /dashboard (auth required)
// - /admin/* (admin role required)
// - /onboarding (auth required)
// - /chat/* (auth required)
// - /sign-out (utility page)
// - /design-system (internal reference)

// API ROUTES (exclude from sitemap, disallow in robots.txt):
// - /api/* (not HTML pages)

// AUTH PAGES (include in sitemap - public access):
// - /sign-in (future consideration)
// - /sign-up (future consideration)
// - /forgot-password (future consideration)
```

**Decision for Auth Pages:**
- Current implementation: Exclude from sitemap (minimal SEO value)
- Future consideration: Include if you want users to find signup via Google
- robots.txt: Allow (not disallowed) but not in sitemap currently

### Next.js 15 Specifics

**robots.ts Type Definition:**

```typescript
type Robots = {
  rules: {
    userAgent: string | string[]
    allow?: string | string[]
    disallow?: string | string[]
    crawlDelay?: number
  } | Array<{
    userAgent: string | string[]
    allow?: string | string[]
    disallow?: string | string[]
    crawlDelay?: number
  }>
  sitemap?: string | string[]
  host?: string
}
```

**sitemap.ts Type Definition:**

```typescript
type Sitemap = Array<{
  url: string
  lastModified?: string | Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: {
    languages?: Record<string, string>
  }
}>
```

**Key Points:**
- Both files must export a default function
- Functions can be async (for dynamic generation)
- Return types must match MetadataRoute.Robots or MetadataRoute.Sitemap
- Next.js automatically serves at /robots.txt and /sitemap.xml
- Files are generated at build time (static) or on-demand (dynamic)

**Static vs Dynamic:**

Current implementation (recommended):
- **Static generation**: Functions are pure, no database calls
- Benefits: Fast, cacheable, generated at build time
- Rebuilds: On each deployment (sitemap always fresh)

Future considerations:
- If routes come from database (blog posts, products), make async
- Fetch data at request time for dynamic sitemaps
- Consider caching for performance

### Localization Context

**Multi-Language Sitemap Strategy:**

Each public route appears once per locale:
- English: `https://example.com/en/`
- Hindi: `https://example.com/hi/`
- Bengali: `https://example.com/bn/`

**Alternative Approach (Not Used Here):**

Sitemap can include `alternates.languages` for each entry:

```typescript
{
  url: 'https://example.com/en/',
  alternates: {
    languages: {
      hi: 'https://example.com/hi/',
      bn: 'https://example.com/bn/',
    },
  },
}
```

**Why Simple Approach:**
- Easier to implement and maintain
- Google discovers language variants via hreflang tags (Story 7.1)
- Sitemap just lists all URLs, hreflang provides language relationships

**Locale Handling:**

```typescript
import { AppConfig } from '@/utils/AppConfig'

// AppConfig.locales is ['en', 'hi', 'bn']
for (const locale of AppConfig.locales) {
  // Generate entry for each locale
}
```

**URL Format:**
- Root locale: `https://example.com/en` (NOT `https://example.com/`)
- next-intl adds locale prefix to all routes
- Match actual URL structure exactly

### Testing Strategy

**Unit Tests:**

```typescript
// src/app/sitemap.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'
import * as config from '@/libs/seo/config'
import { AppConfig } from '@/utils/AppConfig'

// Mock dependencies
vi.mock('@/libs/seo/config')
vi.mock('@/utils/AppConfig', () => ({
  AppConfig: {
    locales: ['en', 'hi', 'bn'],
  },
}))

describe('sitemap', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com')
  })

  it('generates entries for all locales', () => {
    const entries = sitemap()

    // 1 public route × 3 locales = 3 entries
    expect(entries).toHaveLength(3)
  })

  it('uses absolute URLs', () => {
    const entries = sitemap()

    expect(entries[0].url).toMatch(/^https:\/\//)
  })

  it('includes all locales', () => {
    const entries = sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://example.com/en')
    expect(urls).toContain('https://example.com/hi')
    expect(urls).toContain('https://example.com/bn')
  })

  it('sets correct priority for homepage', () => {
    const entries = sitemap()

    // All homepage entries should have priority 1.0
    entries.forEach((entry) => {
      expect(entry.priority).toBe(1.0)
    })
  })

  it('sets correct changeFrequency for homepage', () => {
    const entries = sitemap()

    entries.forEach((entry) => {
      expect(entry.changeFrequency).toBe('daily')
    })
  })

  it('includes lastModified for all entries', () => {
    const entries = sitemap()

    entries.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
    })
  })
})

describe('generateLocalizedUrls helper', () => {
  // If exported, test separately
  // If internal, tested via sitemap() function above
})
```

**E2E Tests:**

```typescript
// tests/seo-robots-sitemap.spec.ts
import { test, expect } from '@playwright/test'

test.describe('SEO - Robots and Sitemap', () => {
  test('robots.txt has correct rules', async ({ page }) => {
    const response = await page.goto('/robots.txt')

    // Should be text/plain
    expect(response?.headers()['content-type']).toContain('text/plain')

    // Get content
    const content = await page.textContent('body')

    // Verify rules
    expect(content).toContain('User-agent: *')
    expect(content).toContain('Allow: /')
    expect(content).toContain('Disallow: /dashboard')
    expect(content).toContain('Disallow: /admin')
    expect(content).toContain('Disallow: /api')
    expect(content).toContain('Sitemap: https://')
  })

  test('sitemap.xml has valid structure', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')

    // Should be XML
    expect(response?.headers()['content-type']).toContain('xml')

    // Get content
    const content = await page.textContent('body')

    // Verify XML structure
    expect(content).toContain('<?xml')
    expect(content).toContain('<urlset')
    expect(content).toContain('xmlns')
  })

  test('sitemap includes all locales', async ({ page }) => {
    await page.goto('/sitemap.xml')

    const content = await page.textContent('body')

    // Check for all locale URLs
    expect(content).toContain('/en')
    expect(content).toContain('/hi')
    expect(content).toContain('/bn')
  })

  test('sitemap excludes private routes', async ({ page }) => {
    await page.goto('/sitemap.xml')

    const content = await page.textContent('body')

    // Should NOT contain auth routes
    expect(content).not.toContain('/dashboard')
    expect(content).not.toContain('/admin')
    expect(content).not.toContain('/onboarding')
  })

  test('sitemap URLs are absolute', async ({ page }) => {
    await page.goto('/sitemap.xml')

    const content = await page.textContent('body')

    // All URLs should start with http
    expect(content).toMatch(/<loc>https?:\/\//g)
  })

  test('sitemap entries have lastmod', async ({ page }) => {
    await page.goto('/sitemap.xml')

    const content = await page.textContent('body')

    // Should have lastmod tags
    expect(content).toContain('<lastmod>')
  })
})
```

### Edge Cases & Considerations

**1. Public Auth Pages:**
- Sign-in, sign-up, forgot-password are technically public
- Current approach: Exclude from sitemap (minimal SEO value)
- Alternative: Include if you want signup/login discoverable via Google
- Recommendation: Exclude initially, add later if needed

**2. Dynamic Routes (Future):**
- Blog posts: `/blog/[slug]`
- Docs: `/docs/[...path]`
- Products: `/product/[id]`
- Implementation: Fetch from database in sitemap() function
- Make sitemap() async and query for all slugs/IDs

**3. Sitemap Size Limits:**
- Max 50,000 URLs per sitemap
- Max 50MB uncompressed
- If exceeded: Use sitemap index (multiple sitemaps)
- Current app: Well under limits

**4. Change Frequency Semantics:**
- `daily`: Homepage, frequently updated content
- `weekly`: Static pages, about, pricing
- `monthly`: Rarely changing pages
- `never`: Archived content
- Note: Google may ignore, uses as hint only

**5. Priority Semantics:**
- 1.0: Homepage (most important)
- 0.8: Key landing pages (about, pricing)
- 0.6: Secondary pages (features, FAQ)
- 0.4: Tertiary pages
- Note: Relative within your site, not global

**6. Locale in Path vs Query:**
- Current app uses path: `/en/`, `/hi/`
- Alternative: Query param `/?locale=en`
- Path-based is better for SEO (each locale is distinct URL)

**7. Trailing Slashes:**
- Next.js normalizes URLs (no trailing slash)
- Sitemap should match: `https://example.com/en` NOT `https://example.com/en/`
- Test actual URLs in browser to verify format

**8. Robots.txt Wildcards:**
- `/dashboard` disallows `/dashboard` and `/dashboard/*`
- `/api` disallows `/api` and all API routes
- No need for `/dashboard/*` (implicit)

### Environment Variables

Uses existing `NEXT_PUBLIC_SITE_URL` from Story 7.1:

```bash
# Site URL (required for SEO - hreflang, Open Graph, sitemaps)
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

**Fallback Behavior:**
- `getSiteUrl()` checks NEXT_PUBLIC_SITE_URL first
- Falls back to NEXT_PUBLIC_APP_URL
- Falls back to VERCEL_PROJECT_PRODUCTION_URL
- Falls back to VERCEL_URL
- Falls back to localhost (dev)

**Important:**
- Set NEXT_PUBLIC_SITE_URL in production for consistent absolute URLs
- Vercel URLs work but custom domain is better

### Project Structure

**Existing Files (Enhanced):**
```
src/
  app/
    robots.ts                     # Enhanced with comprehensive rules
    sitemap.ts                    # Enhanced with locale support
  libs/
    seo/
      config.ts                   # Existing: getSiteUrl()
      constants.ts                # Existing: SEO constants
  utils/
    AppConfig.ts                  # Existing: locales config
```

**New Files:**
```
src/
  app/
    sitemap.test.ts               # Unit tests for sitemap helpers
tests/
  seo-robots-sitemap.spec.ts      # E2E tests for robots/sitemap
```

**Updated Files:**
```
CLAUDE.md                         # Add SEO configuration docs
_bmad-output/implementation-artifacts/
  sprint-status.yaml              # Update story status
```

**Import Pattern:**
```typescript
import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/libs/seo/config'
import { AppConfig } from '@/utils/AppConfig'
```

### Validation Tools

**Sitemap Validators:**
- XML Sitemaps: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Google Search Console: Submit sitemap after deployment
- Screaming Frog SEO Spider: Desktop tool for sitemap analysis

**Robots.txt Testers:**
- Google Search Console: Robots.txt Tester
- robots.txt Checker: https://support.google.com/webmasters/answer/6062598
- Screaming Frog: Also validates robots.txt

**Best Practice:**
1. Test locally: Visit /robots.txt and /sitemap.xml in browser
2. Validate XML: Use online validator before deploying
3. Submit to Google: Add sitemap to Search Console
4. Monitor: Check Search Console for indexing issues

### References

- [Source: Epic 7 Story 7.3] - Full acceptance criteria
- [Source: Story 7.1] - Existing SEO utilities (getSiteUrl)
- [Source: src/app/robots.ts] - Current robots.txt implementation
- [Source: src/app/sitemap.ts] - Current sitemap implementation
- [robots.txt Specification](https://www.robotstxt.org/) - Official spec
- [Sitemaps Protocol](https://www.sitemaps.org/) - XML sitemap standard
- [Next.js Metadata Files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) - Next.js docs
- [Google Search Central](https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap) - Sitemap best practices

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
