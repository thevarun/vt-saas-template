# pSEO Tracking Integration Guide

## Overview

This guide is for the **Epic 8 team** who are building programmatic SEO (pSEO) pages. It shows you how to integrate analytics tracking into your pSEO pages using the utilities created by the Analytics team.

**What you get**:
- Automatic page view tracking for every pSEO page
- Category and slug tracking for segmentation
- Referrer capture for traffic source analysis
- Type-safe event tracking (TypeScript prevents errors)
- Zero configuration - works in dev (console) and prod (PostHog)

## Quick Start

### Option 1: Component-Based Approach (Recommended)

**Best for**: Simple pSEO pages where you just need to drop in tracking.

```tsx
// app/[locale]/(pseo)/[category]/[slug]/page.tsx
import { PseoPageTracker } from '@/libs/analytics'

export default async function PseoPage(props: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await props.params

  return (
    <>
      {/* Add tracker component - it's invisible and tracks on mount */}
      <PseoPageTracker category={category} slug={slug} />

      {/* Your pSEO content */}
      <main>
        <h1>{/* Page title */}</h1>
        <div>{/* Page content */}</div>
      </main>
    </>
  )
}
```

**That's it!** The component automatically:
- Tracks `pseo_page_viewed` event on page load
- Captures category and slug from props
- Captures referrer from `document.referrer`
- Returns `null` (invisible component)

### Option 2: Hook-Based Approach

**Best for**: Client components where you need more control or already have hooks.

```tsx
'use client'

import { usePseoTracking } from '@/libs/analytics'

export function PseoPageClient({
  category,
  slug,
  children,
}: {
  category: string
  slug: string
  children: React.ReactNode
}) {
  // Call hook at top of component
  usePseoTracking(category, slug)

  return (
    <main>
      {children}
    </main>
  )
}
```

**Note**: The hook approach requires a client component (`'use client'`).

## Integration Patterns

### Pattern 1: Dynamic Route with Params

**Scenario**: pSEO pages use dynamic routes like `/tools/[slug]` or `/[category]/[slug]`.

```tsx
// app/[locale]/(pseo)/[category]/[slug]/page.tsx
import { PseoPageTracker } from '@/libs/analytics'

type PseoPageProps = {
  params: Promise<{
    locale: string
    category: string
    slug: string
  }>
}

export default async function PseoPage({ params }: PseoPageProps) {
  const { category, slug } = await params

  // Fetch page data
  const pageData = await getPseoPageData(category, slug)

  if (!pageData) {
    notFound()
  }

  return (
    <>
      <PseoPageTracker category={category} slug={slug} />

      <article>
        <h1>{pageData.title}</h1>
        <div>{pageData.content}</div>
      </article>
    </>
  )
}
```

**Where values come from**:
- `category`: Route param from URL (e.g., `tools` in `/tools/password-generator`)
- `slug`: Route param from URL (e.g., `password-generator`)

### Pattern 2: Fixed Category

**Scenario**: All pages in a route segment belong to same category.

```tsx
// app/[locale]/(pseo)/tools/[slug]/page.tsx
import { PseoPageTracker } from '@/libs/analytics'

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <>
      {/* Category is hardcoded, slug is dynamic */}
      <PseoPageTracker category="tools" slug={slug} />

      {/* Page content */}
    </>
  )
}
```

### Pattern 3: Client Component with Hook

**Scenario**: Page is a client component (needs `useState`, `useEffect`, etc.).

```tsx
'use client'

import { usePseoTracking } from '@/libs/analytics'
import { useEffect, useState } from 'react'

export default function InteractivePseoPage({
  category,
  slug,
}: {
  category: string
  slug: string
}) {
  usePseoTracking(category, slug)

  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch client-side data
    fetchData().then(setData)
  }, [])

  return (
    <div>
      {/* Interactive content */}
    </div>
  )
}
```

### Pattern 4: Server Component with Client Tracker

**Scenario**: Keep page as server component, but tracking needs client-side.

```tsx
// app/[locale]/(pseo)/[category]/[slug]/page.tsx
import { PseoClientTracker } from './PseoClientTracker'

export default async function PseoPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const data = await getPseoPageData(category, slug)

  return (
    <>
      <PseoClientTracker category={category} slug={slug} />
      {/* Server-rendered content */}
      <article>{data.content}</article>
    </>
  )
}
```

```tsx
// app/[locale]/(pseo)/[category]/[slug]/PseoClientTracker.tsx
'use client'

import { PseoPageTracker } from '@/libs/analytics'

export function PseoClientTracker({
  category,
  slug,
}: {
  category: string
  slug: string
}) {
  return <PseoPageTracker category={category} slug={slug} />
}
```

## Property Mapping

### Category

**What it is**: High-level grouping of pSEO pages.

**Examples**:
- `tools` - For utility tools (password generator, QR code, etc.)
- `templates` - For templates (email, resume, etc.)
- `guides` - For how-to guides
- `calculators` - For calculation tools
- `comparisons` - For comparison pages

**Where it comes from**:
- URL structure: `/[category]/[slug]`
- Fixed value: All pages in route have same category
- Database: Fetched from your pSEO content source

**Recommendation**: Use lowercase, kebab-case for consistency.

### Slug

**What it is**: Unique identifier for individual pSEO page.

**Examples**:
- `password-generator`
- `qr-code-generator`
- `nextjs-starter-template`

**Where it comes from**:
- URL structure: `/tools/[slug]`
- Database: Generated from page title or content ID

**Recommendation**: Use lowercase, kebab-case, keep it URL-friendly.

### Referrer (Automatic)

**What it is**: URL of the page the user came from (captured automatically).

**Examples**:
- `https://google.com/search?q=...` - Organic search
- `https://twitter.com/...` - Social media
- `` (empty) - Direct traffic
- Same-origin URL - Internal navigation

**Where it comes from**: `document.referrer` (captured automatically by component/hook).

**Note**: You don't need to pass this - it's captured automatically.

## Testing Your Integration

### Development Mode (Console Logging)

When `NEXT_PUBLIC_POSTHOG_KEY` is not set, events are logged to browser console.

**Steps**:
1. Start dev server: `pnpm dev`
2. Navigate to a pSEO page
3. Open browser DevTools (F12) → Console tab
4. Look for output like:

```
📊 [Analytics] Event #1: pseo_page_viewed
Category: page
Timestamp: 2026-02-10T12:00:00.000Z

Properties:
┗━ category: "tools"
┗━ slug: "password-generator"
┗━ referrer: "https://google.com/search?q=password+generator"
```

**Verify**:
- ✅ Event name is `pseo_page_viewed`
- ✅ Category matches your route structure
- ✅ Slug matches the page you're viewing
- ✅ Referrer shows where you came from (or undefined for direct)
- ✅ No errors in console

### Production Mode (PostHog)

When `NEXT_PUBLIC_POSTHOG_KEY` is set, events are sent to PostHog.

**Steps**:
1. Deploy to staging/production (with PostHog key set)
2. Navigate to a pSEO page
3. Open PostHog dashboard → Live Events
4. Filter for event name: `pseo_page_viewed`
5. Inspect event properties

**Verify**:
- ✅ Events appear in real-time (< 1 minute delay)
- ✅ Properties are correct (category, slug, referrer)
- ✅ User ID is attached (if user is logged in)
- ✅ No duplicate events on page load

### Automated Testing

**Unit Test Example** (for custom pSEO components):

```tsx
import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Mock analytics
vi.mock('@/libs/analytics', () => ({
  trackEvent: vi.fn(),
}))

import { trackEvent } from '@/libs/analytics'
import { YourPseoPage } from './YourPseoPage'

it('tracks pSEO page view', () => {
  render(<YourPseoPage category="tools" slug="test-tool" />)

  expect(trackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
    category: 'tools',
    slug: 'test-tool',
    referrer: undefined,
  })
})
```

## Common Pitfalls

### ❌ Pitfall 1: Passing Static Values

```tsx
// WRONG - category/slug don't come from route
<PseoPageTracker category="tools" slug="password-generator" />
```

**Problem**: Every page tracks the same category/slug.

**Solution**: Get values from route params:
```tsx
const { category, slug } = await params
<PseoPageTracker category={category} slug={slug} />
```

### ❌ Pitfall 2: Forgetting `'use client'` with Hook

```tsx
// WRONG - server component using hook
export default async function Page() {
  usePseoTracking('tools', 'test') // Error: Hooks don't work in server components
}
```

**Problem**: Hooks require client components.

**Solution**: Either:
- Use `<PseoPageTracker>` component (works in server components)
- Add `'use client'` directive to use hook

### ❌ Pitfall 3: Tracking in Wrong Component

```tsx
// WRONG - tracker in shared layout
// app/[locale]/(pseo)/layout.tsx
export default function PseoLayout({ children }) {
  return (
    <>
      <PseoPageTracker category="unknown" slug="unknown" /> {/* Tracks for all pages */}
      {children}
    </>
  )
}
```

**Problem**: Tracker runs for every page in layout, not just the specific pSEO page.

**Solution**: Place tracker in individual `page.tsx` files, not layouts.

### ❌ Pitfall 4: Multiple Trackers

```tsx
// WRONG - multiple trackers on same page
export default function Page() {
  return (
    <>
      <PseoPageTracker category="tools" slug="test" />
      <PseoPageTracker category="tools" slug="test" /> {/* Duplicate */}
    </>
  )
}
```

**Problem**: Tracks event twice on page load.

**Solution**: Only include tracker once per page.

### ❌ Pitfall 5: Incorrect Category/Slug Format

```tsx
// WRONG - inconsistent naming
<PseoPageTracker category="Tools" slug="Password Generator" />
```

**Problem**: Inconsistent casing/spacing makes analytics filtering harder.

**Solution**: Use lowercase, kebab-case consistently:
```tsx
<PseoPageTracker category="tools" slug="password-generator" />
```

## Advanced Usage

### Custom Properties (Future)

If you need to track additional properties beyond category/slug/referrer:

```tsx
// NOT CURRENTLY SUPPORTED - but here's how it could work
trackEvent('pseo_page_viewed', {
  category: 'tools',
  slug: 'password-generator',
  referrer: document.referrer,
  // Custom properties
  template_version: 'v2',
  is_premium: false,
})
```

**Note**: Currently, only category/slug/referrer are tracked. If you need custom properties, reach out to the Analytics team.

### Conditional Tracking

**Scenario**: Only track in production, not in preview environments.

```tsx
const shouldTrack = process.env.NODE_ENV === 'production'

return (
  <>
    {shouldTrack && <PseoPageTracker category={category} slug={slug} />}
    {/* content */}
  </>
)
```

### Tracking Template Variants

**Scenario**: You have multiple templates for the same pSEO type.

```tsx
// Use category to distinguish templates
<PseoPageTracker
  category={`tools-${templateVersion}`}
  slug={slug}
/>
// Examples: "tools-v1", "tools-v2", "tools-premium"
```

## Analytics Dashboard Setup

After integrating tracking, view metrics in PostHog. See the **PostHog pSEO Dashboard Guide** (`posthog-pseo-dashboard.md`) for:
- Creating insights
- Filtering by category
- Building conversion funnels
- Analyzing referral sources

## Integration Checklist

Before marking integration complete:

- [ ] Tracking implemented on all pSEO page types
- [ ] Category values are consistent and lowercase
- [ ] Slug values match URL slugs
- [ ] Tested in development (console logs appear)
- [ ] Tested in staging/production (PostHog events appear)
- [ ] No duplicate tracking on page load
- [ ] No errors in browser console
- [ ] Events include correct properties (category, slug, referrer)
- [ ] User ID is attached for logged-in users
- [ ] Events appear in PostHog within 1 minute

## Support

**Questions or Issues?**

1. Check console logs in development mode
2. Verify PostHog key is set in environment variables
3. Review this guide's Common Pitfalls section
4. Contact Analytics team for help

**Common Questions**:

**Q: Do I need to pass referrer manually?**
A: No, it's captured automatically from `document.referrer`.

**Q: What if category/slug contains spaces or special characters?**
A: Convert to lowercase kebab-case (e.g., "Password Generator" → "password-generator").

**Q: Can I track other properties?**
A: Not currently. Reach out to Analytics team if you need custom properties.

**Q: Does tracking work in ISR/SSG pages?**
A: Yes, tracking is client-side so it works with any rendering strategy.

**Q: What if a user has JavaScript disabled?**
A: Tracking won't work, but the page will still render normally (analytics is non-blocking).

## Next Steps

1. **Implement tracking** on your pSEO pages
2. **Test in development** to verify console output
3. **Deploy to staging** and verify PostHog events
4. **Set up PostHog dashboard** (see `posthog-pseo-dashboard.md`)
5. **Monitor performance** regularly to optimize pSEO strategy

Happy tracking! 🚀
