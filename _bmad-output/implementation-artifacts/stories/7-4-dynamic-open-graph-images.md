# Story 7.4: Dynamic Open Graph Images

Status: ready-for-dev

## Story

As a user sharing specific content,
I want dynamically generated preview images,
so that shared links have contextual, branded previews.

## Acceptance Criteria

### AC1: OG Image Generation Endpoint
**Given** the OG image generation endpoint
**When** I access /api/og or /og/[...path]
**Then** an image is generated on the edge
**And** image is returned as PNG
**And** generation is fast (< 500ms)

### AC2: Default OG Image Design
**Given** the default OG image
**When** generated without parameters
**Then** image shows app name/logo
**And** image uses brand colors
**And** image is 1200x630 pixels
**And** text is readable and well-positioned

### AC3: Page-Specific OG Images
**Given** page-specific OG images
**When** a page passes title parameter
**Then** image includes the page title
**And** layout adapts to title length
**And** branding elements remain consistent

### AC4: OG Image Template Implementation
**Given** the OG image template
**When** I review the implementation
**Then** @vercel/og (or similar) is used
**And** template is in `src/app/api/og/route.tsx` or similar
**And** template uses JSX for layout
**And** fonts are properly loaded

### AC5: Customization Support
**Given** customization needs
**When** I want to modify OG image design
**Then** template is clearly structured
**And** colors reference brand variables
**And** logo/assets are easily swappable
**And** documentation explains customization

### AC6: OG Image Caching
**Given** OG image caching
**When** same parameters are requested
**Then** images are cached at edge
**And** cache headers are properly set
**And** regeneration happens on deploy or param change

### AC7: Error Handling
**Given** error handling
**When** OG generation fails
**Then** fallback to static default image
**And** error is logged
**And** user doesn't see broken image

## Tasks / Subtasks

- [ ] Task 1: Install @vercel/og dependency (AC: #4)
  - [ ] Subtask 1.1: Install `@vercel/og` package via npm
  - [ ] Subtask 1.2: Verify version compatibility with Next.js 15
  - [ ] Subtask 1.3: Check package.json to confirm installation
  - [ ] Subtask 1.4: Update package-lock.json

- [ ] Task 2: Create OG image route handler (AC: #1, #4)
  - [ ] Subtask 2.1: Create `src/app/api/og/route.tsx` file
  - [ ] Subtask 2.2: Import ImageResponse from @vercel/og
  - [ ] Subtask 2.3: Create GET handler function
  - [ ] Subtask 2.4: Extract searchParams (title, description) from URL
  - [ ] Subtask 2.5: Set response content-type to image/png
  - [ ] Subtask 2.6: Configure edge runtime for fast generation
  - [ ] Subtask 2.7: Return ImageResponse with JSX template
  - [ ] Subtask 2.8: Add proper TypeScript types for handler

- [ ] Task 3: Design default OG image template (AC: #2, #5)
  - [ ] Subtask 3.1: Create JSX template for default image (no params)
  - [ ] Subtask 3.2: Use 1200x630 dimensions via ImageResponse options
  - [ ] Subtask 3.3: Add "VT SaaS Template" text prominently
  - [ ] Subtask 3.4: Use brand colors (define as constants)
  - [ ] Subtask 3.5: Add visual branding elements (logo placeholder)
  - [ ] Subtask 3.6: Use flexbox layout for centering
  - [ ] Subtask 3.7: Set readable font sizes (min 48px for title)
  - [ ] Subtask 3.8: Test template renders correctly

- [ ] Task 4: Add dynamic title support (AC: #3)
  - [ ] Subtask 4.1: Read `title` query parameter from URL
  - [ ] Subtask 4.2: Display title in OG image if provided
  - [ ] Subtask 4.3: Fallback to "VT SaaS Template" if no title
  - [ ] Subtask 4.4: Adjust font size based on title length
  - [ ] Subtask 4.5: Truncate long titles (max 60 chars with ellipsis)
  - [ ] Subtask 4.6: Keep branding elements (logo, colors) consistent

- [ ] Task 5: Add dynamic description support (AC: #3)
  - [ ] Subtask 5.1: Read `description` query parameter from URL
  - [ ] Subtask 5.2: Display description below title if provided
  - [ ] Subtask 5.3: Use smaller font size for description (32px)
  - [ ] Subtask 5.4: Truncate long descriptions (max 120 chars)
  - [ ] Subtask 5.5: Adjust layout spacing with/without description
  - [ ] Subtask 5.6: Ensure text doesn't overflow container

- [ ] Task 6: Load and configure fonts (AC: #4)
  - [ ] Subtask 6.1: Choose web-safe font (Inter, Roboto, or system font)
  - [ ] Subtask 6.2: Fetch font file from Google Fonts or CDN
  - [ ] Subtask 6.3: Load font data in route handler (await fetch)
  - [ ] Subtask 6.4: Pass font to ImageResponse options
  - [ ] Subtask 6.5: Set font weights (regular 400, bold 700)
  - [ ] Subtask 6.6: Handle font loading errors gracefully

- [ ] Task 7: Configure caching headers (AC: #6)
  - [ ] Subtask 7.1: Set Cache-Control header for edge caching
  - [ ] Subtask 7.2: Use public, max-age=31536000 for static params
  - [ ] Subtask 7.3: Use stale-while-revalidate for dynamic params
  - [ ] Subtask 7.4: Add ETag support for conditional requests
  - [ ] Subtask 7.5: Test caching behavior in browser DevTools
  - [ ] Subtask 7.6: Verify Vercel Edge Network caching

- [ ] Task 8: Add error handling and logging (AC: #7)
  - [ ] Subtask 8.1: Wrap ImageResponse in try/catch block
  - [ ] Subtask 8.2: Log errors to console with context
  - [ ] Subtask 8.3: Return static fallback on error (redirect to /og-image.png)
  - [ ] Subtask 8.4: Handle font loading failures
  - [ ] Subtask 8.5: Handle invalid query parameters gracefully
  - [ ] Subtask 8.6: Add error monitoring (Sentry integration)
  - [ ] Subtask 8.7: Test error scenarios (missing font, invalid params)

- [ ] Task 9: Create SEO constants for OG image (AC: #5)
  - [ ] Subtask 9.1: Update `src/libs/seo/constants.ts` with OG image URL
  - [ ] Subtask 9.2: Add `OG_IMAGE_ENDPOINT = '/api/og'` constant
  - [ ] Subtask 9.3: Add `OG_IMAGE_WIDTH = 1200` constant
  - [ ] Subtask 9.4: Add `OG_IMAGE_HEIGHT = 630` constant
  - [ ] Subtask 9.5: Export constants for use in metadata
  - [ ] Subtask 9.6: Document usage in comments

- [ ] Task 10: Create helper for OG image URLs (AC: #3, #5)
  - [ ] Subtask 10.1: Add `buildOgImageUrl()` function to `src/libs/seo/opengraph.ts`
  - [ ] Subtask 10.2: Accept title and description parameters
  - [ ] Subtask 10.3: Build URL with query params: `/api/og?title=...&description=...`
  - [ ] Subtask 10.4: URL-encode parameters properly
  - [ ] Subtask 10.5: Return absolute URL using getSiteUrl()
  - [ ] Subtask 10.6: Add TypeScript types for parameters
  - [ ] Subtask 10.7: Export function for use in page metadata

- [ ] Task 11: Update generateSocialMetadata to use dynamic OG images (AC: #3)
  - [ ] Subtask 11.1: Update `generateSocialMetadata()` in `src/libs/seo/opengraph.ts`
  - [ ] Subtask 11.2: If no custom image provided, use buildOgImageUrl()
  - [ ] Subtask 11.3: Pass title and description to buildOgImageUrl()
  - [ ] Subtask 11.4: Set openGraph.images to dynamic OG image URL
  - [ ] Subtask 11.5: Set twitter.images to same dynamic OG image URL
  - [ ] Subtask 11.6: Keep static /og-image.png as ultimate fallback
  - [ ] Subtask 11.7: Test metadata uses correct OG image URL

- [ ] Task 12: Add brand color constants (AC: #2, #5)
  - [ ] Subtask 12.1: Extract brand colors from Tailwind config
  - [ ] Subtask 12.2: Create color constants in OG route handler
  - [ ] Subtask 12.3: Use primary brand color for background
  - [ ] Subtask 12.4: Use contrast color for text (ensure accessibility)
  - [ ] Subtask 12.5: Add accent color for visual elements
  - [ ] Subtask 12.6: Document color choices in comments

- [ ] Task 13: Write unit tests for buildOgImageUrl (AC: #3)
  - [ ] Subtask 13.1: Create `src/libs/seo/opengraph.test.ts`
  - [ ] Subtask 13.2: Test buildOgImageUrl with title only
  - [ ] Subtask 13.3: Test buildOgImageUrl with title and description
  - [ ] Subtask 13.4: Test URL encoding of special characters
  - [ ] Subtask 13.5: Test absolute URL is returned
  - [ ] Subtask 13.6: Mock getSiteUrl() for consistent tests
  - [ ] Subtask 13.7: Test empty parameters fallback

- [ ] Task 14: Add E2E test for OG image endpoint (AC: #1, #2)
  - [ ] Subtask 14.1: Create `tests/seo-og-image.spec.ts`
  - [ ] Subtask 14.2: Navigate to /api/og endpoint
  - [ ] Subtask 14.3: Verify response is image/png content type
  - [ ] Subtask 14.4: Verify response status is 200
  - [ ] Subtask 14.5: Test with title parameter: /api/og?title=Test
  - [ ] Subtask 14.6: Test with title and description parameters
  - [ ] Subtask 14.7: Verify image dimensions are 1200x630 (via metadata)
  - [ ] Subtask 14.8: Test generation time is < 500ms

- [ ] Task 15: Visual testing for OG image (AC: #2, #3)
  - [ ] Subtask 15.1: Generate default OG image (no params)
  - [ ] Subtask 15.2: Save image to `_bmad-output/implementation-artifacts/screenshots/og-default.png`
  - [ ] Subtask 15.3: Generate OG image with title "Dashboard"
  - [ ] Subtask 15.4: Save image to `_bmad-output/implementation-artifacts/screenshots/og-with-title.png`
  - [ ] Subtask 15.5: Generate OG image with title + description
  - [ ] Subtask 15.6: Save image to `_bmad-output/implementation-artifacts/screenshots/og-full.png`
  - [ ] Subtask 15.7: Manually verify text is readable
  - [ ] Subtask 15.8: Verify branding is consistent across variants

- [ ] Task 16: Test OG image with social media validators (AC: #2, #3)
  - [ ] Subtask 16.1: Deploy to preview environment
  - [ ] Subtask 16.2: Test default OG image with Facebook Sharing Debugger
  - [ ] Subtask 16.3: Test dynamic OG image with title parameter
  - [ ] Subtask 16.4: Test with Twitter Card Validator
  - [ ] Subtask 16.5: Verify images render correctly in previews
  - [ ] Subtask 16.6: Check for any warnings or errors
  - [ ] Subtask 16.7: Document validation results

- [ ] Task 17: Add documentation to CLAUDE.md (AC: #5)
  - [ ] Subtask 17.1: Add "Dynamic OG Images" section to CLAUDE.md
  - [ ] Subtask 17.2: Document OG image endpoint usage
  - [ ] Subtask 17.3: Explain query parameters (title, description)
  - [ ] Subtask 17.4: Show example URLs with parameters
  - [ ] Subtask 17.5: Document how to customize template design
  - [ ] Subtask 17.6: Explain buildOgImageUrl() helper usage
  - [ ] Subtask 17.7: Link to @vercel/og documentation

- [ ] Task 18: Performance optimization (AC: #1, #6)
  - [ ] Subtask 18.1: Verify edge runtime is enabled
  - [ ] Subtask 18.2: Test cold start performance
  - [ ] Subtask 18.3: Test warm cache performance
  - [ ] Subtask 18.4: Optimize font loading (cache font data)
  - [ ] Subtask 18.5: Minimize template complexity (avoid expensive operations)
  - [ ] Subtask 18.6: Test generation time meets < 500ms target
  - [ ] Subtask 18.7: Monitor performance in production

## Dev Notes

### Technical Implementation Overview

Story 7.4 implements dynamic Open Graph image generation using @vercel/og (based on Satori). The endpoint generates branded preview images at the edge with customizable title and description, providing contextual social media previews for shared content.

**Key Concepts:**
- **@vercel/og**: Vercel's library for generating OG images using JSX and Satori
- **ImageResponse**: Next.js 15 API for creating dynamic images
- **Edge Runtime**: Runs at edge locations for fast global generation
- **Satori**: HTML/CSS to SVG renderer (powers @vercel/og)

**Important Context:**
- Story 7.2 created `src/libs/seo/opengraph.ts` with metadata utilities
- Story 7.2 created static `/og-image.png` as fallback (1200x630)
- Story 7.1 created `getSiteUrl()` for absolute URLs
- Dynamic OG images enhance static fallback with per-page customization

### Critical Architecture Requirements

**Next.js 15 App Router API Routes:**

Dynamic OG images are implemented as Route Handlers in the App Router:
- Location: `src/app/api/og/route.tsx` (note .tsx extension for JSX)
- Export: `export async function GET(request: Request)`
- Runtime: Edge runtime for global low-latency generation
- Response: ImageResponse from @vercel/og

**@vercel/og Pattern:**

```typescript
// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'VT SaaS Template'
  const description = searchParams.get('description') || ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-900
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold' }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 36, marginTop: 20 }}>
            {description}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
```

**Edge Runtime Requirement:**

Must use `export const runtime = 'edge'` for optimal performance:
- Runs at Vercel Edge Network locations
- Lower latency (< 100ms from user)
- Automatic global distribution
- No cold starts (faster than serverless)

**Font Loading:**

Fonts must be loaded explicitly in edge runtime:

```typescript
import { ImageResponse } from 'next/og'

export async function GET(request: NextRequest) {
  // Fetch font data
  const fontData = await fetch(
    new URL('../../assets/Inter-Bold.ttf', import.meta.url),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    <div style={{ fontFamily: 'Inter' }}>...</div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )
}
```

**Alternative: Use Google Fonts CDN:**

```typescript
const fontData = await fetch(
  'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap',
).then((res) => res.arrayBuffer())
```

### Implementation Strategy

**Phase 1: Install Dependencies and Create Route**

```bash
npm install @vercel/og
```

Create `src/app/api/og/route.tsx`:

```typescript
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'VT SaaS Template'
    const description = searchParams.get('description')

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // slate-900 from Tailwind
            color: '#ffffff',
            padding: '40px 80px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 56 : 72,
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '1040px',
              lineHeight: 1.2,
            }}
          >
            {title.slice(0, 60)}{title.length > 60 ? '...' : ''}
          </div>

          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: 32,
                marginTop: 20,
                textAlign: 'center',
                maxWidth: '900px',
                opacity: 0.9,
              }}
            >
              {description.slice(0, 120)}{description.length > 120 ? '...' : ''}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '80px',
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            VT SaaS Template
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (error) {
    console.error('OG image generation failed:', error)
    // Return minimal fallback
    return new Response('Failed to generate image', { status: 500 })
  }
}
```

**Phase 2: Add Brand Colors**

Extract colors from Tailwind config for consistency:

```typescript
// Brand colors from Tailwind config
const BRAND_COLORS = {
  background: '#0f172a', // slate-900
  text: '#ffffff',       // white
  accent: '#3b82f6',     // blue-500
  muted: '#94a3b8',      // slate-400
}

// Use in template
<div style={{ backgroundColor: BRAND_COLORS.background, color: BRAND_COLORS.text }}>
```

**Phase 3: Add Font Support**

Download Inter font and load it:

```typescript
export async function GET(request: NextRequest) {
  // Fetch Inter font from Google Fonts
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff',
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    <div style={{ fontFamily: 'Inter' }}>...</div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )
}
```

**Phase 4: Create Helper Function**

Add to `src/libs/seo/opengraph.ts`:

```typescript
import { getSiteUrl } from './config'

export interface OgImageOptions {
  title?: string
  description?: string
}

/**
 * Build absolute URL for dynamic OG image
 * @param options - Title and description for image
 * @returns Absolute URL to OG image endpoint with query params
 */
export function buildOgImageUrl(options: OgImageOptions = {}): string {
  const siteUrl = getSiteUrl()
  const params = new URLSearchParams()

  if (options.title) {
    params.set('title', options.title)
  }

  if (options.description) {
    params.set('description', options.description)
  }

  const queryString = params.toString()
  return `${siteUrl}/api/og${queryString ? `?${queryString}` : ''}`
}
```

**Phase 5: Update generateSocialMetadata**

Modify existing function to use dynamic OG images:

```typescript
import { buildOgImageUrl } from './opengraph'

export function generateSocialMetadata(options: SocialMetadataOptions): Metadata {
  const { title, description, image, path } = options
  const siteUrl = getSiteUrl()
  const url = path ? `${siteUrl}${path}` : siteUrl

  // Use provided image, or generate dynamic OG image, or fallback to static
  const ogImage = image || buildOgImageUrl({ title, description })

  return {
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
```

**Phase 6: Configure Caching**

Add cache headers for optimal performance:

```typescript
export async function GET(request: NextRequest) {
  const imageResponse = new ImageResponse(...)

  // Add cache headers
  const headers = new Headers()
  headers.set('Content-Type', 'image/png')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(imageResponse.body, {
    headers,
    status: 200,
  })
}
```

**Alternatively, use Next.js caching:**

```typescript
export async function GET(request: NextRequest) {
  // Next.js will automatically cache ImageResponse
  return new ImageResponse(...)
}

// No manual headers needed - Next.js handles caching
```

### Supported CSS Subset

Satori (underlying engine) supports limited CSS:

**Supported Properties:**
- `display: flex` (no grid)
- `flexDirection`, `flexWrap`, `alignItems`, `justifyContent`
- `width`, `height`, `maxWidth`, `maxHeight`
- `margin`, `padding`
- `fontSize`, `fontWeight`, `fontStyle`, `fontFamily`
- `color`, `backgroundColor`
- `border`, `borderRadius`
- `opacity`
- `position: absolute/relative`
- `top`, `bottom`, `left`, `right`

**NOT Supported:**
- CSS Grid
- `transform` (scale, rotate, etc.)
- `box-shadow`
- `background-image` (except gradients)
- Advanced selectors (`:hover`, etc.)
- External images (must be base64 or URLs)

**Workarounds:**
- Use flexbox for all layouts
- Use solid colors instead of shadows
- Inline SVGs for logos/icons
- Keep designs simple and readable

### Testing Strategy

**Unit Tests:**

```typescript
// src/libs/seo/opengraph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOgImageUrl } from './opengraph'
import * as config from './config'

vi.mock('./config')

describe('buildOgImageUrl', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com')
  })

  it('returns base URL without params', () => {
    const url = buildOgImageUrl()
    expect(url).toBe('https://example.com/api/og')
  })

  it('includes title param', () => {
    const url = buildOgImageUrl({ title: 'Dashboard' })
    expect(url).toBe('https://example.com/api/og?title=Dashboard')
  })

  it('includes title and description params', () => {
    const url = buildOgImageUrl({
      title: 'Dashboard',
      description: 'User dashboard'
    })
    expect(url).toContain('title=Dashboard')
    expect(url).toContain('description=User+dashboard')
  })

  it('URL encodes special characters', () => {
    const url = buildOgImageUrl({ title: 'Hello & Welcome!' })
    expect(url).toContain('Hello+%26+Welcome%21')
  })
})
```

**E2E Tests:**

```typescript
// tests/seo-og-image.spec.ts
import { test, expect } from '@playwright/test'

test.describe('SEO - Dynamic OG Images', () => {
  test('generates default OG image', async ({ page }) => {
    const response = await page.goto('/api/og')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('image/png')
  })

  test('generates OG image with title', async ({ page }) => {
    const response = await page.goto('/api/og?title=Dashboard')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('image/png')
  })

  test('generates OG image with title and description', async ({ page }) => {
    const response = await page.goto(
      '/api/og?title=Dashboard&description=User+dashboard',
    )

    expect(response?.status()).toBe(200)
  })

  test('generation is fast', async ({ page }) => {
    const start = Date.now()
    await page.goto('/api/og?title=Test')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(500)
  })
})
```

**Visual Testing:**

Use Playwright to capture generated images:

```typescript
test('captures OG image screenshots', async ({ page }) => {
  // Default image
  await page.goto('/api/og')
  await page.screenshot({
    path: '_bmad-output/implementation-artifacts/screenshots/og-default.png'
  })

  // With title
  await page.goto('/api/og?title=Dashboard')
  await page.screenshot({
    path: '_bmad-output/implementation-artifacts/screenshots/og-with-title.png'
  })

  // With title and description
  await page.goto('/api/og?title=Dashboard&description=User+analytics')
  await page.screenshot({
    path: '_bmad-output/implementation-artifacts/screenshots/og-full.png'
  })
})
```

### Edge Cases & Considerations

**1. Long Titles:**
- Titles > 60 characters should truncate with ellipsis
- Adjust font size dynamically: `fontSize: title.length > 40 ? 56 : 72`
- Test with titles of varying lengths

**2. Long Descriptions:**
- Descriptions > 120 characters should truncate
- Consider line wrapping instead of truncation
- Test multi-line descriptions

**3. Special Characters:**
- URL encode query parameters properly
- Use `URLSearchParams` for automatic encoding
- Test with quotes, ampersands, Unicode

**4. Font Loading Failures:**
- Satori falls back to default font if custom font fails
- Wrap font fetch in try/catch
- Log font loading errors
- Test with unreachable font URLs

**5. Image Generation Errors:**
- Return 500 status on error (or redirect to static fallback)
- Log errors to Sentry
- Don't expose error details to user
- Test with invalid JSX/CSS

**6. Cache Invalidation:**
- Cache by full URL (including query params)
- Same params = same cached image
- Deploy triggers cache refresh
- Test cache behavior in DevTools

**7. Image Size Limits:**
- Vercel has 4.5MB response size limit (Edge Functions)
- OG images should be < 100KB (PNG compression)
- Test with complex designs
- Monitor response sizes

**8. Rate Limiting:**
- Edge functions have generous rate limits
- Consider if under attack scenario
- Monitor usage in Vercel dashboard

### Performance Optimization

**Cold Start Performance:**
- Edge runtime has minimal cold start (< 10ms)
- Font loading is main bottleneck
- Cache font data if possible
- Use CDN-hosted fonts for reliability

**Generation Time:**
- Target: < 500ms per image
- Typical: 100-200ms on Edge
- Optimize by:
  - Simple JSX templates
  - Minimize nested divs
  - Use web-safe fonts
  - Avoid expensive operations

**Caching Strategy:**
- First request: Generate and cache (200-300ms)
- Subsequent requests: Serve from cache (< 50ms)
- Cache duration: Indefinite (immutable URLs)
- Cache invalidation: On deployment

**Vercel Edge Network:**
- Automatically distributed globally
- Low latency from all locations
- No manual CDN setup needed
- Free on Vercel plans

### Environment Variables

No new environment variables needed. Uses existing:
- `NEXT_PUBLIC_SITE_URL` - For absolute OG image URLs (from Story 7.1)

### Project Structure

**New Files:**
```
src/
  app/
    api/
      og/
        route.tsx                   # OG image generation endpoint
  libs/
    seo/
      opengraph.test.ts             # Tests for buildOgImageUrl
tests/
  seo-og-image.spec.ts              # E2E tests for OG endpoint
_bmad-output/
  implementation-artifacts/
    screenshots/
      og-default.png                # Visual test artifacts
      og-with-title.png
      og-full.png
```

**Updated Files:**
```
src/
  libs/
    seo/
      opengraph.ts                  # Add buildOgImageUrl helper
      constants.ts                  # Add OG_IMAGE_ENDPOINT constant
package.json                        # Add @vercel/og dependency
CLAUDE.md                           # Document OG image usage
```

**Import Pattern:**
```typescript
// In OG route handler
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

// In metadata files
import { buildOgImageUrl } from '@/libs/seo/opengraph'
import { getSiteUrl } from '@/libs/seo/config'
```

### Customization Guide

**Changing Brand Colors:**

```typescript
// In src/app/api/og/route.tsx
const BRAND_COLORS = {
  background: '#yourColor',  // Update from Tailwind config
  text: '#yourColor',
  accent: '#yourColor',
}
```

**Adding Logo:**

```typescript
<div style={{ display: 'flex', alignItems: 'center' }}>
  {/* SVG logo inline */}
  <svg width="60" height="60" viewBox="0 0 60 60">
    {/* Your logo SVG paths */}
  </svg>
  <div style={{ marginLeft: 20, fontSize: 72 }}>
    {title}
  </div>
</div>
```

**Changing Font:**

```typescript
// Download different font
const fontData = await fetch(
  'https://fonts.gstatic.com/s/roboto/v30/...',
).then((res) => res.arrayBuffer())

// Update font name in template
<div style={{ fontFamily: 'Roboto' }}>...</div>

// Update fonts config
fonts: [
  { name: 'Roboto', data: fontData, weight: 700 },
]
```

**Changing Layout:**

```typescript
// Horizontal layout instead of vertical
<div style={{
  display: 'flex',
  flexDirection: 'row',  // Changed from 'column'
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '60px 80px',
}}>
  <div style={{ fontSize: 64 }}>{title}</div>
  <div style={{ fontSize: 32 }}>{description}</div>
</div>
```

### Validation Tools

**OG Image Validators:**
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

**Testing Workflow:**
1. Deploy to preview environment
2. Test default image: `https://preview.vercel.app/api/og`
3. Test with params: `https://preview.vercel.app/api/og?title=Test`
4. Validate with Facebook/Twitter tools
5. Check image renders correctly
6. Verify no warnings/errors

**Local Testing:**
```bash
npm run dev
# Visit http://localhost:3000/api/og
# Visit http://localhost:3000/api/og?title=Test&description=Testing
```

### References

- [Source: Epic 7 Story 7.4] - Full acceptance criteria
- [Source: Story 7.2] - Existing OG metadata utilities
- [Source: Story 7.1] - getSiteUrl() helper
- [@vercel/og Documentation](https://vercel.com/docs/functions/edge-functions/og-image-generation) - Official docs
- [Satori](https://github.com/vercel/satori) - Underlying rendering engine
- [Next.js ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response) - Next.js API
- [OG Image Best Practices](https://www.opengraph.xyz/) - Design guidelines

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
