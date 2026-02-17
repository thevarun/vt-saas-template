# Story 7.2: Open Graph & Twitter Card Metadata

Status: ready-for-dev

## Story

As a user sharing the app on social media,
I want rich previews with images and descriptions,
so that my shares look professional and informative.

## Acceptance Criteria

### AC1: Landing Page Open Graph Metadata
**Given** the landing page
**When** I share on Facebook/LinkedIn
**Then** Open Graph preview shows: title, description, image
**And** title is the app name or page title
**And** description is compelling and accurate
**And** image is the default OG image (1200x630)

### AC2: Landing Page Twitter Card Metadata
**Given** the landing page
**When** I share on Twitter
**Then** Twitter Card preview shows: title, description, image
**And** card type is "summary_large_image"
**And** image displays correctly in timeline

### AC3: Default Metadata Configuration in Root Layout
**Given** page metadata
**When** I review the root layout
**Then** default openGraph config is set
**And** default twitter config is set
**And** site name, type, and images are configured

### AC4: Page-Specific Metadata Overrides
**Given** individual pages
**When** they have specific metadata
**Then** page-specific OG overrides default
**And** titles include page name + site name
**And** descriptions are page-appropriate

### AC5: OG Image Asset Configuration
**Given** the OG image configuration
**When** I check image URLs
**Then** default OG image exists at /og-image.png or similar
**And** image is 1200x630 pixels
**And** image includes app branding
**And** URL is absolute

### AC6: Social Media Validation
**Given** metadata validation
**When** I test with Facebook Sharing Debugger
**Then** no errors or warnings appear
**And** preview renders correctly
**When** I test with Twitter Card Validator
**Then** card renders correctly

## Tasks / Subtasks

- [ ] Task 1: Create Open Graph metadata utility (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1: Create `src/libs/seo/opengraph.ts` for OG metadata generation
  - [ ] Subtask 1.2: Implement `generateOpenGraphMetadata()` function
  - [ ] Subtask 1.3: Accept parameters: title, description, image (optional), path
  - [ ] Subtask 1.4: Return Next.js Metadata format for openGraph
  - [ ] Subtask 1.5: Use absolute URLs for images (use getSiteUrl())
  - [ ] Subtask 1.6: Set og:type to "website" for all pages
  - [ ] Subtask 1.7: Include og:url with absolute page URL
  - [ ] Subtask 1.8: Include og:site_name as "VT SaaS Template"
  - [ ] Subtask 1.9: Add TypeScript types for OG metadata parameters

- [ ] Task 2: Create Twitter Card metadata utility (AC: #2, #3, #4)
  - [ ] Subtask 2.1: Implement `generateTwitterMetadata()` function in same file
  - [ ] Subtask 2.2: Accept same parameters as OG metadata
  - [ ] Subtask 2.3: Return Next.js Metadata format for twitter
  - [ ] Subtask 2.4: Set twitter:card to "summary_large_image"
  - [ ] Subtask 2.5: Include twitter:title, twitter:description, twitter:image
  - [ ] Subtask 2.6: Use absolute URLs for images
  - [ ] Subtask 2.7: Add TypeScript types for Twitter metadata parameters

- [ ] Task 3: Create combined social metadata utility (AC: #3, #4)
  - [ ] Subtask 3.1: Implement `generateSocialMetadata()` helper function
  - [ ] Subtask 3.2: Accept title, description, image, path parameters
  - [ ] Subtask 3.3: Call both generateOpenGraphMetadata() and generateTwitterMetadata()
  - [ ] Subtask 3.4: Merge results into single Metadata object
  - [ ] Subtask 3.5: Return combined metadata for convenience
  - [ ] Subtask 3.6: Export all functions (individual + combined)

- [ ] Task 4: Create default OG image asset (AC: #5)
  - [ ] Subtask 4.1: Create `public/og-image.png` with 1200x630 dimensions
  - [ ] Subtask 4.2: Include "VT SaaS Template" branding in image
  - [ ] Subtask 4.3: Use brand colors from project design system
  - [ ] Subtask 4.4: Ensure text is readable at small preview sizes
  - [ ] Subtask 4.5: Optimize PNG file size (< 1MB)
  - [ ] Subtask 4.6: Test image renders correctly in social platforms

- [ ] Task 5: Update root layout with default social metadata (AC: #1, #2, #3)
  - [ ] Subtask 5.1: Update `src/app/[locale]/layout.tsx` generateMetadata function
  - [ ] Subtask 5.2: Import generateSocialMetadata from seo library
  - [ ] Subtask 5.3: Define default title: "VT SaaS Template"
  - [ ] Subtask 5.4: Define default description (from project brief)
  - [ ] Subtask 5.5: Set default OG image to "/og-image.png"
  - [ ] Subtask 5.6: Generate social metadata with defaults
  - [ ] Subtask 5.7: Merge with existing metadata (icons, alternates from 7.1)
  - [ ] Subtask 5.8: Ensure all URLs are absolute

- [ ] Task 6: Add page-specific metadata to landing page (AC: #4)
  - [ ] Subtask 6.1: Update `src/app/[locale]/page.tsx` with generateMetadata
  - [ ] Subtask 6.2: Define page-specific title and description
  - [ ] Subtask 6.3: Use generateSocialMetadata() for consistency
  - [ ] Subtask 6.4: Override defaults where needed
  - [ ] Subtask 6.5: Test that page metadata merges with root layout
  - [ ] Subtask 6.6: Verify title format: "Page Title | VT SaaS Template"

- [ ] Task 7: Add metadata configuration constants (AC: #3, #4)
  - [ ] Subtask 7.1: Create `src/libs/seo/constants.ts` for default values
  - [ ] Subtask 7.2: Define DEFAULT_OG_IMAGE constant
  - [ ] Subtask 7.3: Define SITE_NAME constant ("VT SaaS Template")
  - [ ] Subtask 7.4: Define DEFAULT_TITLE constant
  - [ ] Subtask 7.5: Define DEFAULT_DESCRIPTION constant
  - [ ] Subtask 7.6: Export all constants for reuse
  - [ ] Subtask 7.7: Update opengraph.ts to use constants

- [ ] Task 8: Write utility tests (AC: #1-#4)
  - [ ] Subtask 8.1: Create `src/libs/seo/opengraph.test.ts`
  - [ ] Subtask 8.2: Test generateOpenGraphMetadata() returns correct structure
  - [ ] Subtask 8.3: Test og:type is "website"
  - [ ] Subtask 8.4: Test og:site_name is set correctly
  - [ ] Subtask 8.5: Test og:image uses absolute URL
  - [ ] Subtask 8.6: Test og:url is absolute with correct path
  - [ ] Subtask 8.7: Test generateTwitterMetadata() returns correct structure
  - [ ] Subtask 8.8: Test twitter:card is "summary_large_image"
  - [ ] Subtask 8.9: Test generateSocialMetadata() merges both correctly
  - [ ] Subtask 8.10: Mock getSiteUrl() to return consistent test domain

- [ ] Task 9: Add E2E test for social metadata presence (AC: #1, #2, #6)
  - [ ] Subtask 9.1: Create `tests/seo-social-metadata.spec.ts`
  - [ ] Subtask 9.2: Navigate to landing page
  - [ ] Subtask 9.3: Extract og:title meta tag from page HTML
  - [ ] Subtask 9.4: Extract og:description meta tag
  - [ ] Subtask 9.5: Extract og:image meta tag
  - [ ] Subtask 9.6: Verify og:image URL is absolute
  - [ ] Subtask 9.7: Extract twitter:card meta tag
  - [ ] Subtask 9.8: Verify twitter:card is "summary_large_image"
  - [ ] Subtask 9.9: Extract twitter:image meta tag
  - [ ] Subtask 9.10: Verify all required OG and Twitter tags present

- [ ] Task 10: Manual validation with social platform tools (AC: #6)
  - [ ] Subtask 10.1: Deploy to preview URL (or use local tunnel)
  - [ ] Subtask 10.2: Test with Facebook Sharing Debugger
  - [ ] Subtask 10.3: Fix any errors/warnings from Facebook
  - [ ] Subtask 10.4: Test with Twitter Card Validator
  - [ ] Subtask 10.5: Fix any errors/warnings from Twitter
  - [ ] Subtask 10.6: Take screenshots of successful previews
  - [ ] Subtask 10.7: Document validation process in story completion notes

- [ ] Task 11: Add documentation (AC: #3, #4)
  - [ ] Subtask 11.1: Add social metadata section to `CLAUDE.md`
  - [ ] Subtask 11.2: Document how to add page-specific OG metadata
  - [ ] Subtask 11.3: Document default metadata configuration
  - [ ] Subtask 11.4: Add example of metadata override
  - [ ] Subtask 11.5: Document OG image requirements (size, format)
  - [ ] Subtask 11.6: Add links to validation tools

## Dev Notes

### Technical Implementation Overview

Story 7.2 implements Open Graph and Twitter Card metadata to enable rich social sharing previews. When users share links to the app on Facebook, LinkedIn, Twitter, or other social platforms, they'll see branded previews with title, description, and image.

**Key Concepts:**
- **Open Graph Protocol**: Meta tags invented by Facebook, used by most social platforms
- **Twitter Cards**: Twitter's own metadata format (similar to OG)
- **summary_large_image**: Twitter card type with prominent image
- **Next.js Metadata API**: Type-safe way to generate social meta tags

### Critical Architecture Requirements

**Metadata Priority Order:**

Next.js merges metadata from multiple sources with this priority:
1. Page-specific `generateMetadata()` (highest)
2. Layout `generateMetadata()` (middle)
3. Parent layout metadata (lowest)

**Key Point**: Page metadata MERGES with layout metadata (not replaces). Use this to set defaults in layout and override specific fields in pages.

**Absolute URL Requirement:**

Social platforms require ABSOLUTE URLs for images. Relative URLs like `/og-image.png` will fail validation.

**Implementation Pattern:**

```typescript
// ❌ WRONG - Relative URL
openGraph: {
  images: ['/og-image.png'] // Fails validation
}

// ✅ CORRECT - Absolute URL
openGraph: {
  images: [`${getSiteUrl()}/og-image.png`]
}
```

### Implementation Strategy

**Phase 1: Utility Functions**

Create reusable utilities for generating social metadata:

```typescript
// src/libs/seo/opengraph.ts
import type { Metadata } from 'next'
import { getSiteUrl } from './config'
import { DEFAULT_OG_IMAGE, SITE_NAME } from './constants'

interface SocialMetadataParams {
  title: string
  description: string
  image?: string
  path?: string
}

export function generateOpenGraphMetadata(params: SocialMetadataParams): Metadata['openGraph'] {
  const { title, description, image = DEFAULT_OG_IMAGE, path = '' } = params
  const siteUrl = getSiteUrl()

  return {
    type: 'website',
    siteName: SITE_NAME,
    title,
    description,
    url: `${siteUrl}${path}`,
    images: [
      {
        url: `${siteUrl}${image}`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  }
}

export function generateTwitterMetadata(params: SocialMetadataParams): Metadata['twitter'] {
  const { title, description, image = DEFAULT_OG_IMAGE } = params
  const siteUrl = getSiteUrl()

  return {
    card: 'summary_large_image',
    title,
    description,
    images: [`${siteUrl}${image}`],
  }
}

export function generateSocialMetadata(params: SocialMetadataParams): Metadata {
  return {
    openGraph: generateOpenGraphMetadata(params),
    twitter: generateTwitterMetadata(params),
  }
}
```

**Phase 2: Constants File**

Centralize default values for reuse:

```typescript
// src/libs/seo/constants.ts
export const SITE_NAME = 'VT SaaS Template'
export const DEFAULT_OG_IMAGE = '/og-image.png'
export const DEFAULT_TITLE = 'VT SaaS Template - Build Your SaaS Fast'
export const DEFAULT_DESCRIPTION = 'Production-ready SaaS template with authentication, internationalization, and AI chat. Built with Next.js 15, Supabase, and TypeScript.'
```

**Phase 3: Root Layout Defaults**

Add default social metadata to all pages:

```typescript
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next'
import { generateHreflangLinks } from '@/libs/seo/hreflang'
import { generateSocialMetadata } from '@/libs/seo/opengraph'
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '@/libs/seo/constants'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params

  // Hreflang from Story 7.1
  const pathname = '/'
  const hreflangLinks = generateHreflangLinks(pathname)
  const alternates = {
    languages: hreflangLinks.reduce((acc, link) => {
      acc[link.hreflang] = link.href
      return acc
    }, {} as Record<string, string>),
  }

  // Social metadata (Story 7.2)
  const socialMetadata = generateSocialMetadata({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: `/${locale}`,
  })

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates,
    ...socialMetadata,
    icons: [
      {
        rel: 'icon',
        url: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/apple-touch-icon.png',
      },
    ],
  }
}
```

**Phase 4: Page-Specific Overrides**

Override defaults on specific pages:

```typescript
// src/app/[locale]/page.tsx (Landing Page)
import type { Metadata } from 'next'
import { generateSocialMetadata } from '@/libs/seo/opengraph'
import { SITE_NAME } from '@/libs/seo/constants'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params

  const title = `Home | ${SITE_NAME}`
  const description = 'Launch your SaaS in days, not months. Complete authentication, internationalization, and AI chat out of the box.'

  return {
    title,
    description,
    ...generateSocialMetadata({
      title,
      description,
      path: `/${locale}`,
    }),
  }
}

export default async function HomePage() {
  // ... page component
}
```

**Phase 5: OG Image Asset**

Create a default Open Graph image:

1. **Dimensions**: 1200x630 pixels (Facebook/OG standard)
2. **Format**: PNG (better quality) or JPG (smaller size)
3. **Content**:
   - App name/logo
   - Tagline or key benefit
   - Brand colors
   - Clean, simple design
4. **Location**: `public/og-image.png`

**Design Tips**:
- Keep important content in center (edges may be cropped)
- Use high contrast for readability
- Test at small preview sizes (thumbnails)
- Avoid small text (minimum 40px font size)

### Next.js 15 Specifics

**Metadata API Structure:**

```typescript
// Type definition (reference)
interface Metadata {
  title?: string | TemplateString
  description?: string
  openGraph?: {
    type?: 'website' | 'article' | 'book' | ...
    siteName?: string
    title?: string
    description?: string
    url?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
    title?: string
    description?: string
    images?: string[] | Array<{ url: string; alt?: string }>
  }
  // ... other fields
}
```

**Async generateMetadata:**
- Use for dynamic metadata (fetching data, reading params)
- Return type: `Promise<Metadata>`
- Automatically merges with parent layout metadata

**Static Metadata:**
- Use `export const metadata: Metadata = { ... }` for static pages
- Cannot be async
- Use for simple, hardcoded metadata

### Localization Context

**Multi-Language Considerations:**

Social metadata should be localized like all user-facing content. However, for this story, we'll use English defaults for all locales. Future enhancement (Story 8.x or 9.x) can add locale-specific titles/descriptions.

**Current Approach:**
- Use English metadata for all locales
- OG image is language-agnostic (branding only)
- Future: Add translation keys for title/description

**URL Structure:**
- OG url includes locale: `https://example.com/en`, `https://example.com/hi`
- Image URL is absolute: `https://example.com/og-image.png`
- Same image used for all locales (for now)

### Testing Strategy

**Unit Tests:**

```typescript
// src/libs/seo/opengraph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateOpenGraphMetadata, generateTwitterMetadata, generateSocialMetadata } from './opengraph'
import * as config from './config'

describe('generateOpenGraphMetadata', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com')
  })

  it('returns correct OG structure', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test Page',
      description: 'Test description',
    })

    expect(og).toMatchObject({
      type: 'website',
      siteName: 'VT SaaS Template',
      title: 'Test Page',
      description: 'Test description',
    })
  })

  it('uses absolute URL for images', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    })

    expect(og?.images?.[0]?.url).toBe('https://example.com/og-image.png')
  })

  it('includes image dimensions', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    })

    expect(og?.images?.[0]).toMatchObject({
      width: 1200,
      height: 630,
    })
  })

  it('uses custom image when provided', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
      image: '/custom-image.png',
    })

    expect(og?.images?.[0]?.url).toBe('https://example.com/custom-image.png')
  })

  it('includes path in og:url', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
      path: '/about',
    })

    expect(og?.url).toBe('https://example.com/about')
  })
})

describe('generateTwitterMetadata', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com')
  })

  it('uses summary_large_image card type', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    })

    expect(twitter?.card).toBe('summary_large_image')
  })

  it('includes title and description', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test Page',
      description: 'Test description',
    })

    expect(twitter).toMatchObject({
      title: 'Test Page',
      description: 'Test description',
    })
  })

  it('uses absolute URL for images', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    })

    expect(twitter?.images?.[0]).toBe('https://example.com/og-image.png')
  })
})

describe('generateSocialMetadata', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com')
  })

  it('combines OG and Twitter metadata', () => {
    const metadata = generateSocialMetadata({
      title: 'Test',
      description: 'Test',
    })

    expect(metadata.openGraph).toBeDefined()
    expect(metadata.twitter).toBeDefined()
  })

  it('uses same title and description for both', () => {
    const metadata = generateSocialMetadata({
      title: 'Test Page',
      description: 'Test description',
    })

    expect(metadata.openGraph?.title).toBe('Test Page')
    expect(metadata.twitter?.title).toBe('Test Page')
  })
})
```

**E2E Tests:**

```typescript
// tests/seo-social-metadata.spec.ts
import { test, expect } from '@playwright/test'

test.describe('SEO - Social Metadata', () => {
  test('landing page has Open Graph tags', async ({ page }) => {
    await page.goto('/')

    // Check og:title
    const ogTitle = await page.locator('meta[property="og:title"]').first()
    expect(ogTitle).toBeTruthy()
    const titleContent = await ogTitle.getAttribute('content')
    expect(titleContent).toBeTruthy()

    // Check og:description
    const ogDescription = await page.locator('meta[property="og:description"]').first()
    expect(ogDescription).toBeTruthy()

    // Check og:image
    const ogImage = await page.locator('meta[property="og:image"]').first()
    expect(ogImage).toBeTruthy()
    const imageUrl = await ogImage.getAttribute('content')
    expect(imageUrl).toMatch(/^https?:\/\//) // Absolute URL

    // Check og:type
    const ogType = await page.locator('meta[property="og:type"]').first()
    const typeContent = await ogType.getAttribute('content')
    expect(typeContent).toBe('website')

    // Check og:site_name
    const ogSiteName = await page.locator('meta[property="og:site_name"]').first()
    const siteNameContent = await ogSiteName.getAttribute('content')
    expect(siteNameContent).toBe('VT SaaS Template')
  })

  test('landing page has Twitter Card tags', async ({ page }) => {
    await page.goto('/')

    // Check twitter:card
    const twitterCard = await page.locator('meta[name="twitter:card"]').first()
    expect(twitterCard).toBeTruthy()
    const cardType = await twitterCard.getAttribute('content')
    expect(cardType).toBe('summary_large_image')

    // Check twitter:title
    const twitterTitle = await page.locator('meta[name="twitter:title"]').first()
    expect(twitterTitle).toBeTruthy()

    // Check twitter:description
    const twitterDescription = await page.locator('meta[name="twitter:description"]').first()
    expect(twitterDescription).toBeTruthy()

    // Check twitter:image
    const twitterImage = await page.locator('meta[name="twitter:image"]').first()
    expect(twitterImage).toBeTruthy()
    const imageUrl = await twitterImage.getAttribute('content')
    expect(imageUrl).toMatch(/^https?:\/\//) // Absolute URL
  })

  test('OG image asset exists', async ({ page }) => {
    // Navigate to OG image URL
    const response = await page.goto('/og-image.png')

    // Should return 200
    expect(response?.status()).toBe(200)

    // Should be an image
    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/^image\//)
  })
})
```

### Edge Cases & Considerations

**1. Custom Domains:**
- Social metadata uses same `getSiteUrl()` as hreflang (Story 7.1)
- Set `NEXT_PUBLIC_SITE_URL` for custom domains
- Test with both Vercel URL and custom domain

**2. Image Caching:**
- Social platforms cache OG images aggressively
- Changing OG image requires cache busting (change filename or add query param)
- Use Facebook/Twitter debugger tools to clear cache

**3. Protected Pages:**
- Dashboard/admin pages should have social metadata
- OG previews show when users share links (even if private)
- Consider: generic metadata for private pages or custom OG image

**4. Dynamic Routes:**
- This story covers static pages only
- Future: Dynamic OG images for blog posts, products, etc. (Story 7.4)
- Pattern: Page-specific `generateMetadata()` with dynamic data

**5. Locale-Specific Metadata:**
- Current implementation uses English metadata for all locales
- Future enhancement: Add locale-specific titles/descriptions via next-intl
- OG image can be locale-specific or shared

**6. Missing OG Image:**
- Always provide fallback OG image
- Validation tools will fail if image URL returns 404
- Test image accessibility in E2E tests

**7. Title Length:**
- Facebook truncates at ~60 characters
- Twitter truncates at ~70 characters
- Keep titles concise, put important info first

**8. Description Length:**
- Facebook shows ~200 characters
- Twitter shows ~200 characters
- Keep descriptions under 200 chars for best results

### Social Platform Validation Tools

**Facebook Sharing Debugger:**
- URL: https://developers.facebook.com/tools/debug/
- Paste your page URL to see preview
- Shows errors/warnings
- Can clear cache ("Scrape Again" button)

**Twitter Card Validator:**
- URL: https://cards-dev.twitter.com/validator
- Paste your page URL to see preview
- Shows card type and preview

**LinkedIn Post Inspector:**
- URL: https://www.linkedin.com/post-inspector/
- Paste your page URL to see preview
- Can clear cache

**Best Practice:**
- Test with all 3 tools before considering story complete
- Fix any errors/warnings
- Take screenshots for documentation

### Environment Variables

No new environment variables needed for this story. Uses existing `NEXT_PUBLIC_SITE_URL` from Story 7.1.

**Reminder:**
```bash
# Site URL (required for SEO - hreflang, Open Graph, sitemaps)
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

### Project Structure

**New Files:**
```
src/
  libs/
    seo/
      opengraph.ts              # OG & Twitter metadata generation
      opengraph.test.ts         # Metadata tests
      constants.ts              # Default values (SITE_NAME, etc.)
public/
  og-image.png                  # Default OG image (1200x630)
tests/
  seo-social-metadata.spec.ts   # E2E tests for social metadata
```

**Updated Files:**
```
src/
  app/[locale]/
    layout.tsx                  # Add default social metadata
  app/[locale]/
    page.tsx                    # Add page-specific metadata
CLAUDE.md                       # Add social metadata documentation
```

**Import Pattern:**
```typescript
import { generateSocialMetadata, generateOpenGraphMetadata, generateTwitterMetadata } from '@/libs/seo/opengraph'
import { SITE_NAME, DEFAULT_OG_IMAGE, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '@/libs/seo/constants'
```

### References

- [Source: Epic 7 Story 7.2] - Full acceptance criteria
- [Source: Story 7.1] - Existing SEO utilities (getSiteUrl, hreflang)
- [Source: src/app/[locale]/layout.tsx] - Current root layout
- [Open Graph Protocol](https://ogp.me/) - Official OG specification
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards) - Official Twitter Card spec
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) - Next.js docs

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
