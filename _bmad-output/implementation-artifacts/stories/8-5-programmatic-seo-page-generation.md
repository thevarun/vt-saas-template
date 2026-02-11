# Story 8.5: Programmatic SEO Page Generation

**Epic:** Epic 8: Go-To-Market Features
**Status:** ready-for-dev
**Story Type:** Feature Development
**Complexity:** High
**Sprint:** Epic 8, Story 5 of 5

---

## User Story

As a **growth-focused product owner**,
I want **to generate SEO pages from data**,
So that **I can capture long-tail search traffic**.

---

## Acceptance Criteria

### AC1: Dynamic Route Pattern Established

**Given** programmatic SEO needs
**When** I want to create data-driven pages
**Then** there is a pattern for dynamic route generation
**And** pattern uses Next.js dynamic routes
**And** pattern is documented with examples

### AC2: Page Template with Metadata

**Given** a pSEO page template
**When** I create pages from data
**Then** route structure is /[category]/[slug]
**And** pages are statically generated at build time
**And** pages have proper metadata (title, description, OG)

### AC3: Data Source Configuration

**Given** the pSEO data source
**When** I configure pages
**Then** data comes from JSON files in /data directory
**And** generateStaticParams is used for static generation

### AC4: Example Implementation

**Given** an example pSEO implementation
**When** I review the code
**Then** example exists in src/app/[locale]/(pseo)/
**And** example demonstrates: data loading, template, metadata
**And** example is well-commented for learning

### AC5: Sitemap Integration

**Given** pSEO pages in sitemap
**When** sitemap is generated
**Then** pSEO pages generate a nested sitemap index for scalability
**And** sitemap updates automatically when new data is added

### AC6: Navigation and Related Pages

**Given** pSEO page content and navigation
**When** I view a generated page
**Then** content is unique and valuable (not thin)
**And** page passes basic SEO checks
**And** pages include breadcrumb navigation reflecting category hierarchy
**And** pages include a "Related Pages" section linking to same-category pages
**And** link generation uses data model relationships (not hardcoded)

### AC7: Analytics Hook Points Documented

**Given** analytics hook points
**When** I review the pSEO page code
**Then** page view and engagement event locations are documented with TODO comments
**And** hook points document: event names and properties
**And** actual analytics imports and event firing are NOT included (handled by Epic 9)

### AC8: Customization Documentation

**Given** customization needs
**When** I want to create my own pSEO pages
**Then** documentation explains the pattern
**And** example template is easy to copy/modify
**And** data format is clearly specified

---

## Technical Specification

### Route Structure

```
src/app/[locale]/(pseo)/
├── layout.tsx                    # Minimal public layout (no auth sidebar)
└── [category]/
    └── [slug]/
        └── page.tsx              # Server component, loads data, renders template
```

### Data Model

```typescript
// libs/pseo/types.ts
interface PseoPageData {
  category: string
  slug: string
  location?: string
  title: string
  description: string
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroBadge: string
  stats: Array<{ label: string; value: string; icon: string }>
  content: {
    heading: string
    body: string          // markdown or HTML
    features: string[]
    proTip?: string
  }
  features: Array<{ title: string; description: string; icon: string }>
  faqs: Array<{ question: string; answer: string }>
  cta: { heading: string; description: string; primaryLabel: string; secondaryLabel: string }
  relatedCategories: Array<{ label: string; slug: string }>
  relatedPages?: Array<{ title: string; slug: string; description: string }>
  updatedAt?: string
}

interface PseoCategoryData {
  slug: string
  label: string
  description: string
  metaTitle?: string
  metaDescription?: string
}
```

### Data Source Structure

```
data/pseo/
├── categories.json               # List of categories with metadata
└── pages/
    ├── marketing-automation/
    │   ├── best-tools-new-york.json
    │   └── best-tools-san-francisco.json
    └── crm-software/
        └── best-tools-chicago.json
```

### Static Generation Implementation

```typescript
// src/app/[locale]/(pseo)/[category]/[slug]/page.tsx

export async function generateStaticParams() {
  const pages = await loadAllPseoPages()
  return pages.map((page) => ({
    category: page.category,
    slug: page.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category, slug } = await params
  const data = await loadPseoPage(category, slug)

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      type: 'article',
    },
  }
}

export default async function PseoPage(props: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale, category, slug } = await props.params
  const data = await loadPseoPage(category, slug)

  // TODO: Analytics — event: "pseo_page_viewed", properties: { category, slug, location: data.location }

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Home', href: `/${locale}` },
        { label: data.category, href: `/${locale}/${category}` },
        { label: data.title },
      ]} />

      <HeroSection
        badge={data.heroBadge}
        title={data.heroTitle}
        description={data.description}
      />

      <StatsBar stats={data.stats} />

      <ContentArea content={data.content} />

      <FeatureGrid features={data.features} />

      <FaqSection faqs={data.faqs} />

      <RelatedPages
        pages={data.relatedPages || []}
        category={category}
        locale={locale}
      />

      <CtaFooter cta={data.cta} category={category} slug={slug} />
    </>
  )
}
```

### Data Loading Helper

```typescript
// libs/pseo/data.ts

import fs from 'fs/promises'
import path from 'path'
import type { PseoPageData, PseoCategoryData } from './types'

const DATA_DIR = path.join(process.cwd(), 'data', 'pseo')

export async function loadAllPseoPages(): Promise<PseoPageData[]> {
  const categories = await loadCategories()
  const pages: PseoPageData[] = []

  for (const category of categories) {
    const categoryPages = await loadCategoryPages(category.slug)
    pages.push(...categoryPages)
  }

  return pages
}

export async function loadCategories(): Promise<PseoCategoryData[]> {
  const filePath = path.join(DATA_DIR, 'categories.json')
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function loadCategoryPages(category: string): Promise<PseoPageData[]> {
  const categoryDir = path.join(DATA_DIR, 'pages', category)
  const files = await fs.readdir(categoryDir)

  const pages = await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(categoryDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const data = JSON.parse(content)
        return { ...data, category }
      })
  )

  return pages
}

export async function loadPseoPage(category: string, slug: string): Promise<PseoPageData> {
  const filePath = path.join(DATA_DIR, 'pages', category, `${slug}.json`)
  const content = await fs.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  return { ...data, category, slug }
}
```

### Component Structure

```
src/components/pseo/
├── HeroSection.tsx               # Hero with data-driven title, badge, CTAs
├── StatsBar.tsx                  # Stats row with configurable items
├── ContentArea.tsx               # Main content + sidebar
├── FeatureGrid.tsx               # Feature cards grid
├── FaqSection.tsx                # 'use client' — shadcn Accordion FAQ
├── CtaFooter.tsx                 # Dark CTA section
├── Breadcrumbs.tsx               # NEW — breadcrumb navigation
├── RelatedPages.tsx              # NEW — related pages grid
└── index.ts                      # Barrel export
```

---

## Implementation Guidelines

### Dependencies

**shadcn components needed:**
- `accordion` - For FAQ section (likely already installed)
- `card` - For feature and related page cards (already installed)
- `badge` - For hero badge (already installed)
- `button` - For CTAs (already installed)

All components should already be installed. Verify with:
```bash
ls src/components/ui/accordion.tsx
ls src/components/ui/card.tsx
```

### Component Mapping

| UI Element | MagicPatterns Source | Project Component | Notes |
|------------|---------------------|-------------------|-------|
| FAQ accordion | Custom `useState` toggle | shadcn `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Replace custom implementation |
| Feature cards | Custom div | shadcn `Card`, `CardHeader`, `CardTitle`, `CardDescription` | Optional — raw divs are fine too |
| CTA buttons | HTML `<button>` | shadcn `Button` | Use `variant="default"` and `variant="outline"` |
| Badges (hero) | Inline `<span>` | shadcn `Badge` | "Updated for 2024" badge |
| Stats icons | lucide-react | lucide-react | Already compatible |
| Navigation | Inline nav in template | **Remove** — use project layout or minimal standalone nav | pSEO pages are public, may not need app nav |
| Footer | Inline footer in template | **Remove** — use project footer or minimal standalone footer | Same rationale |

### Code Style Requirements

- Add `'use client'` directive to `FaqSection.tsx` (interactive accordion)
- Use `cn()` from `@/utils/Helpers` for className merging
- Use semantic color tokens (`bg-muted`, `bg-primary`, `text-foreground`, `text-muted-foreground`)
- Replace hardcoded colors (`indigo-600`, `slate-*`) with semantic tokens
- Use Tailwind `transition-*` classes (no framer-motion)
- No semicolons, single quotes for JSX (Antfu ESLint config)
- All content data-driven via props (no hardcoded strings)

### Sitemap Integration

Update `src/app/sitemap.ts` to include pSEO routes:

```typescript
// Add to existing sitemap.ts

import { loadAllPseoPages } from '@/libs/pseo/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  // Existing routes...

  // Add pSEO pages
  const pseoPages = await loadAllPseoPages()
  const pseoEntries = pseoPages.map((page) => ({
    url: `${baseUrl}/en/${page.category}/${page.slug}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    // ...existing entries,
    ...pseoEntries,
  ]
}
```

### Analytics Hook Points

```typescript
// In page.tsx (server component, add TODO for client wrapper):
// TODO: Analytics — event: "pseo_page_viewed", properties: { category, slug, location }

// In CtaFooter.tsx CTA buttons:
// TODO: Analytics — event: "pseo_cta_clicked", properties: { category, slug, ctaType: "primary" | "secondary" }

// In RelatedPages.tsx link clicks:
// TODO: Analytics — event: "pseo_related_page_clicked", properties: { fromSlug, toSlug, category }

// In ContentArea.tsx sidebar links:
// TODO: Analytics — event: "pseo_sidebar_link_clicked", properties: { category, linkType: "toc" | "related_category" | "promo" }
```

**IMPORTANT:** Do NOT import analytics utilities. Epic 9 handles actual event firing.

---

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| Full Template | MagicPatterns | https://www.magicpatterns.com/c/o9a8d4f3rkxfpuuv5zy3pl | PseoTemplate.tsx, HeroSection.tsx, StatsBar.tsx, ContentArea.tsx, FeatureGrid.tsx, FaqSection.tsx, CtaFooter.tsx |

**Extraction Command:**
```typescript
mcp__magic-patterns__read_files(
  url: "https://www.magicpatterns.com/c/o9a8d4f3rkxfpuuv5zy3pl",
  fileNames: [
    "PseoTemplate.tsx",
    "HeroSection.tsx",
    "StatsBar.tsx",
    "ContentArea.tsx",
    "FeatureGrid.tsx",
    "FaqSection.tsx",
    "CtaFooter.tsx"
  ]
)
```

**Adaptation Checklist:**
- [ ] Replace `indigo-600`, `indigo-50`, `slate-*` with semantic tokens (`bg-primary`, `bg-muted`, `text-foreground`)
- [ ] Replace hardcoded placeholder strings (`{Category}`, `{Location}`) with data-driven props
- [ ] Replace custom `useState` accordion with shadcn `Accordion` component
- [ ] Remove inline nav/footer from `PseoTemplate.tsx` — use route group layout instead
- [ ] Add `'use client'` directive to `FaqSection.tsx`
- [ ] Create `generateStaticParams` and `generateMetadata` in page.tsx
- [ ] Create `Breadcrumbs.tsx` component (not in MagicPatterns — build from scratch)
- [ ] Create `RelatedPages.tsx` component (not in MagicPatterns — build from scratch)
- [ ] Add sitemap integration to `src/app/sitemap.ts`
- [ ] Create data loader functions in `libs/pseo/data.ts`
- [ ] Create TypeScript types in `libs/pseo/types.ts`
- [ ] Create example data files in `data/pseo/` directory
- [ ] Add analytics TODO comments (do NOT import analytics)
- [ ] Create barrel export in `src/components/pseo/index.ts`

**Reference Documents:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-8-gtm-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-8-pseo-component-strategy.md`

### Adaptations from MagicPatterns Code

| What | Before (MagicPatterns) | After (Project) |
|------|----------------------|------------------|
| Colors | `indigo-600`, `indigo-50`, `slate-*` hardcoded | `primary`, `primary-foreground`, `bg-muted`, `text-foreground`, `text-muted-foreground` |
| Placeholders | String literals `{Category}`, `{Location}` | Props: `category: string`, `location: string`, `slug: string` |
| Content | Hardcoded article text | Data-driven via props from JSON data source |
| FAQ | Custom `useState` accordion | shadcn `Accordion` component |
| Nav/Footer | Inline in `PseoTemplate.tsx` | Remove — standalone public layout or project layout |
| `'use client'` | Not present | Add to `FaqSection.tsx` (interactive accordion) |
| Static generation | Not present | `generateStaticParams` + `generateMetadata` in page.tsx |
| Breadcrumbs | Not present | **Add** per AC — `Home > {Category} > {Page Title}` |
| Related Pages | Not present | **Add** per AC — links to same-category pages from data model |
| Sitemap | Not present | **Add** pSEO routes to `sitemap.ts` |

### Example Data Files

Create example data files for demonstration:

**data/pseo/categories.json:**
```json
[
  {
    "slug": "marketing-automation",
    "label": "Marketing Automation",
    "description": "Tools and platforms for automating marketing workflows",
    "metaTitle": "Marketing Automation Software",
    "metaDescription": "Discover the best marketing automation tools"
  },
  {
    "slug": "crm-software",
    "label": "CRM Software",
    "description": "Customer relationship management platforms",
    "metaTitle": "CRM Software Solutions",
    "metaDescription": "Compare top CRM software platforms"
  }
]
```

**data/pseo/pages/marketing-automation/best-tools-new-york.json:**
```json
{
  "slug": "best-tools-new-york",
  "location": "New York",
  "title": "Best Marketing Automation Tools in New York",
  "description": "Comprehensive guide to marketing automation platforms used by New York businesses",
  "metaTitle": "Best Marketing Automation Tools in New York | 2024 Guide",
  "metaDescription": "Discover top marketing automation tools trusted by New York businesses. Compare features, pricing, and integrations.",
  "heroTitle": "Best Marketing Automation Tools in New York",
  "heroBadge": "Updated for 2024",
  "stats": [
    { "label": "Tools Reviewed", "value": "50+", "icon": "TrendingUp" },
    { "label": "NY Businesses", "value": "1,200+", "icon": "Users" },
    { "label": "Avg. ROI", "value": "340%", "icon": "DollarSign" },
    { "label": "Support Rating", "value": "4.8/5", "icon": "Star" }
  ],
  "content": {
    "heading": "Why Marketing Automation Matters for New York Businesses",
    "body": "New York's fast-paced business environment demands efficient marketing...",
    "features": [
      "Email campaign automation",
      "Lead scoring and nurturing",
      "Multi-channel orchestration",
      "Analytics and reporting"
    ],
    "proTip": "Start with email automation before expanding to multi-channel campaigns"
  },
  "features": [
    {
      "title": "Enterprise-Grade Automation",
      "description": "Scale your campaigns across email, social, and paid channels",
      "icon": "Zap"
    },
    {
      "title": "Advanced Segmentation",
      "description": "Target the right audience with behavioral and demographic data",
      "icon": "Target"
    },
    {
      "title": "Real-Time Analytics",
      "description": "Track performance and optimize campaigns on the fly",
      "icon": "BarChart3"
    }
  ],
  "faqs": [
    {
      "question": "What's the best marketing automation tool for small businesses in NYC?",
      "answer": "For small businesses, we recommend starting with platforms like Mailchimp or HubSpot's free tier..."
    },
    {
      "question": "How much should I budget for marketing automation?",
      "answer": "Entry-level plans start around $50/month, while enterprise solutions can range from $1,000-$5,000/month..."
    }
  ],
  "cta": {
    "heading": "Ready to Automate Your Marketing?",
    "description": "Join 1,200+ New York businesses using marketing automation to grow faster",
    "primaryLabel": "Get Started Free",
    "secondaryLabel": "View Pricing"
  },
  "relatedPages": [
    {
      "title": "Best Marketing Automation Tools in San Francisco",
      "slug": "best-tools-san-francisco",
      "description": "Compare top platforms used by SF tech companies"
    }
  ],
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### Testing Strategy

**Manual Testing:**
1. Verify static generation works: `npm run build`
2. Check generated routes in `.next/server/app/[locale]/(pseo)/`
3. Test page loads with different category/slug combinations
4. Verify metadata appears in page source (View Source)
5. Test breadcrumb navigation links work correctly
6. Test related pages section shows relevant links
7. Verify FAQ accordion interaction (keyboard + mouse)
8. Test on mobile viewport (responsive layout)
9. Verify dark mode appearance
10. Check sitemap includes all pSEO pages: visit `/sitemap.xml`

**SEO Validation:**
- Use Lighthouse to verify SEO score
- Check meta tags with browser DevTools
- Verify OpenGraph tags for social sharing
- Ensure unique titles/descriptions per page
- Validate structured data (if added)

**Visual Verification:**
- Capture screenshots of example pages using Playwright MCP
- Save to `_bmad-output/implementation-artifacts/screenshots/8-5/`
- Verify layout matches design intent
- Check color usage (semantic tokens, not hardcoded)

---

## Definition of Done

- [ ] Route group created: `src/app/[locale]/(pseo)/`
- [ ] Layout created: `src/app/[locale]/(pseo)/layout.tsx`
- [ ] Page route created: `src/app/[locale]/(pseo)/[category]/[slug]/page.tsx`
- [ ] `generateStaticParams` implemented for static generation
- [ ] `generateMetadata` implemented with proper SEO tags
- [ ] Data loader utilities created in `libs/pseo/data.ts`
- [ ] TypeScript types defined in `libs/pseo/types.ts`
- [ ] All pSEO components extracted and adapted from MagicPatterns:
  - [ ] `HeroSection.tsx`
  - [ ] `StatsBar.tsx`
  - [ ] `ContentArea.tsx`
  - [ ] `FeatureGrid.tsx`
  - [ ] `FaqSection.tsx`
  - [ ] `CtaFooter.tsx`
- [ ] New components built from scratch:
  - [ ] `Breadcrumbs.tsx`
  - [ ] `RelatedPages.tsx`
- [ ] Barrel export created: `src/components/pseo/index.ts`
- [ ] Example data files created in `data/pseo/` directory
- [ ] Sitemap integration added to `src/app/sitemap.ts`
- [ ] Analytics hook points documented with TODO comments (no imports)
- [ ] Code follows project style (no semicolons, single quotes, semantic colors)
- [ ] FAQ section uses `'use client'` directive
- [ ] Build completes successfully with static pages generated
- [ ] All acceptance criteria met and verified
- [ ] Manual testing completed
- [ ] SEO validation passed
- [ ] Screenshots captured for visual verification
- [ ] Documentation comments added for learning/customization

---

## Related Stories

- **8.1: Share Widget Component** - pSEO pages will use ShareWidget for social sharing
- **9.6: pSEO Analytics Instrumentation** - Depends on 8.5 completion; will wire analytics events

---

## Notes for Developer

This story creates a **template/example implementation** for programmatic SEO pages. The goal is to provide a clear, well-documented pattern that developers can copy and customize for their specific use cases.

**Key Design Decisions:**

1. **Static Generation:** All pages pre-rendered at build time for maximum performance and SEO
2. **Data-Driven:** Content separated from presentation — easy to scale to thousands of pages
3. **Componentized:** Each page section is a reusable component
4. **Type-Safe:** Full TypeScript support with clear data interfaces
5. **SEO-First:** Proper metadata, OpenGraph tags, sitemap integration
6. **Analytics-Ready:** Hook points documented for Epic 9 instrumentation

**Customization Guide:**

To create your own pSEO pages:
1. Define your data model (extend or replace `PseoPageData`)
2. Create JSON files in `data/pseo/` following the example structure
3. Customize components in `src/components/pseo/` to match your content needs
4. Update route path if needed (e.g., `/blog/[slug]` instead of `/[category]/[slug]`)
5. Add category-specific logic in data loaders if needed

**MagicPatterns Note:**

The MagicPatterns design (`PseoTemplate.tsx`) is a complete page composition. Extract individual section components (HeroSection, StatsBar, etc.) rather than using the full template. The template shows how sections fit together, but we'll compose them in the Next.js page component for better integration with App Router patterns.

**Parallel Development Note:**

Epic 9 will add actual analytics event firing. Your TODO comments will serve as the integration points. Do NOT import any analytics utilities in this story.

Story 9.6 depends on this story being completed first — it will instrument the pSEO pages with analytics tracking.

---

## Acceptance Criteria Coverage

| AC | Implementation |
|----|----------------|
| AC1: Dynamic Route Pattern | `[category]/[slug]` route structure with docs |
| AC2: Page Template with Metadata | `generateMetadata`, static generation, OG tags |
| AC3: Data Source Configuration | JSON files in `/data/pseo/`, data loader functions |
| AC4: Example Implementation | Full example in `(pseo)` route group with comments |
| AC5: Sitemap Integration | `sitemap.ts` updated to include pSEO routes |
| AC6: Navigation and Related Pages | Breadcrumbs + RelatedPages components |
| AC7: Analytics Hook Points | TODO comments throughout with event specs |
| AC8: Customization Documentation | Dev Notes section + inline code comments |

---

**Created:** 2026-02-11
**Ready for Development:** Yes
