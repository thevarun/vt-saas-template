# Implementation Brief: T-006 — SEO and Accessibility Quick Fixes

## Theme Metadata
- **ID**: T-006
- **Name**: SEO and Accessibility Quick Fixes
- **Effort**: S
- **Risk**: LOW
- **Coverage Gate**: ADEQUATE
- **Blast Radius**: MODERATE
- **Warnings**: None

## Enriched Implementation Steps

### Step 1 — Fix hero title: div -> h1, section titles: div -> h2 [F-090]

**File**: `src/features/landing/CenteredHero.tsx`

Line 10: Change the outer `div` wrapping `props.title` to `h1`:
```tsx
// Before
<div className="mt-3 text-center text-5xl font-bold tracking-tight">
  {props.title}
</div>

// After
<h1 className="mt-3 text-center text-5xl font-bold tracking-tight">
  {props.title}
</h1>
```

**File**: `src/features/landing/Section.tsx`

Line 21: Change the `div` wrapping `props.title` inside the section header to `h2`:
```tsx
// Before
{props.title && (
  <div className="mt-1 text-3xl font-bold">{props.title}</div>
)}

// After
{props.title && (
  <h2 className="mt-1 text-3xl font-bold">{props.title}</h2>
)}
```

---

### Step 2 — Add aria-labels to footer social icon links [F-091]

**File**: `src/templates/Footer.tsx`

Each of the seven icon `<Link>` elements (lines 21-74) needs an `aria-label` and its inner `<svg>` needs `aria-hidden="true"`. The social platforms in order are: GitHub, Facebook, Twitter/X, YouTube, LinkedIn, Threads/Mastodon, RSS.

Example for the first link (GitHub):
```tsx
// Before
<Link href="/">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297..." />
  </svg>
</Link>

// After
<Link href="/" aria-label="Follow us on GitHub">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 .297..." />
  </svg>
</Link>
```

Apply the same pattern to all seven links with descriptive labels:
- Link 1 (GitHub SVG `M12 .297`): `aria-label="Follow us on GitHub"`
- Link 2 (Facebook SVG `M23.998 12`): `aria-label="Follow us on Facebook"`
- Link 3 (Twitter SVG `M23.954 4.569`): `aria-label="Follow us on Twitter"`
- Link 4 (YouTube SVG `M23.495 6.205`): `aria-label="Follow us on YouTube"`
- Link 5 (LinkedIn SVG `M20.447 20.452`): `aria-label="Follow us on LinkedIn"`
- Link 6 (Threads SVG `M11.585 5.267`): `aria-label="Follow us on Threads"`
- Link 7 (RSS SVG `M19.199 24`): `aria-label="Subscribe to our RSS feed"`

---

### Step 3 — Add nav landmark and accessible label to navbar; fix logo link [F-092]

**File**: `src/features/landing/CenteredMenu.tsx`

The component currently wraps everything in a plain `div` (line 21) with an inner `<nav>` covering only the main links. The outer wrapper should become a `<header>` element, and the logo `<Link>` needs an `aria-label`. The `ToggleMenuButton` (line 25) needs an accessible label (check if the component already provides one via its own `aria-label` prop or `aria-expanded`; if not, add `aria-label="Toggle navigation menu"` there).

```tsx
// Before
<div className="flex flex-wrap items-center justify-between">
  <Link href="/">{props.logo}</Link>
  <div className="lg:hidden ...">
    <ToggleMenuButton onClick={handleToggleMenu} />
  </div>
  <nav className={cn('rounded-t max-lg:mt-2', navClass)}>
    ...
  </nav>
  ...
</div>

// After
<header className="flex flex-wrap items-center justify-between">
  <Link href="/" aria-label="Go to homepage">{props.logo}</Link>
  <div className="lg:hidden ...">
    <ToggleMenuButton onClick={handleToggleMenu} />
  </div>
  <nav aria-label="Main navigation" className={cn('rounded-t max-lg:mt-2', navClass)}>
    ...
  </nav>
  ...
</header>
```

---

### Step 4 — Change mobile header h1 to span in MainAppShell [F-094]

**File**: `src/components/layout/MainAppShell.tsx`

Line 285: The mobile header renders `<h1 className="text-lg font-semibold">VT SaaS Template</h1>`. This conflicts with page-level h1 elements on every authenticated route.

```tsx
// Before
<h1 className="text-lg font-semibold">VT SaaS Template</h1>

// After
<span className="text-lg font-semibold">VT SaaS Template</span>
```

---

### Step 5 — Add aria-label to ToastClose button [F-095]

**File**: `src/components/ui/toast.tsx`

Lines 65-77: `ToastClose` renders a `<ToastPrimitives.Close>` wrapping an `<X />` icon with no accessible text. Add `aria-label="Dismiss notification"` to the primitive:

```tsx
// Before
const ToastClose = ({ ref, className, ...props }: ...) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(..., className)}
    toast-close=""
    {...props}
  >
    <X className="size-4" />
  </ToastPrimitives.Close>
);

// After
const ToastClose = ({ ref, className, ...props }: ...) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(..., className)}
    toast-close=""
    aria-label="Dismiss notification"
    {...props}
  >
    <X className="size-4" aria-hidden="true" />
  </ToastPrimitives.Close>
);
```

---

### Step 6 — Add canonical URL to root layout generateMetadata [F-096]

**File**: `src/app/[locale]/layout.tsx`

The existing `generateMetadata()` (line 19) sets `alternates.languages` for hreflang but does not set `alternates.canonical`. Add the canonical pointing to the English (default) root:

```tsx
import { getSiteUrl } from '@/libs/seo/config';

// Inside generateMetadata, add to the return object:
return {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/`,
    languages,
  },
  ...socialMetadata,
  icons: [...],
};
```

`getSiteUrl` is already available at `src/libs/seo/config.ts` and is used internally by `generateSocialMetadata`. Import it directly.

---

### Step 7 — Add prefers-reduced-motion overrides in global.css [F-097]

**File**: `src/styles/global.css`

The accordion animations are defined in the `@theme` block (lines 40-58). Add a `@media (prefers-reduced-motion: reduce)` block after the closing `}` of the `@theme` block (after line 59) and before `@layer base`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This covers both the accordion keyframe animations and any Tailwind `transition-*` utility classes used throughout components.

---

### Step 8 — Remove tabIndex=-1 from password reveal button [F-098]

**File**: `src/components/ui/password-input.tsx`

Line 29: The reveal toggle button has `tabIndex={-1}` making it unreachable by keyboard. The button already has a correct dynamic `aria-label` (`"Hide password"` / `"Show password"`). Simply remove the `tabIndex` prop:

```tsx
// Before
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  aria-label={showPassword ? 'Hide password' : 'Show password'}
  tabIndex={-1}
>

// After
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
```

---

### Step 9 — Add skip-to-main-content link; add id to main element [F-099]

**File**: `src/components/layout/MainAppShell.tsx`

Two changes are needed:

**9a.** Add a visually-hidden skip link as the very first child of the shell's rendered output (before the sidebar `aside`). Use the standard visually-hidden-until-focused pattern:

```tsx
{/* Skip navigation for keyboard users */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-ring focus:rounded-md"
>
  Skip to main content
</a>
```

**9b.** Add `id="main-content"` to the existing `<main>` element (line 289):

```tsx
// Before
<main className="flex-1 overflow-auto">

// After
<main id="main-content" className="flex-1 overflow-auto">
```

---

### Step 10 — Fix breadcrumb structured data: replace NEXT_PUBLIC_APP_URL with getSiteUrl() [F-100]

**File**: `src/components/pseo/Breadcrumbs.tsx`

Line 40 uses `process.env.NEXT_PUBLIC_APP_URL` which is not defined in this project (the project uses `NEXT_PUBLIC_SITE_URL`). This causes all schema.org `item` URLs to be empty strings, producing invalid structured data.

```tsx
// Before (line 13 area — add import)
import Link from 'next/link';
import type { PseoCategory } from '@/libs/pseo/data';

// After — add getSiteUrl import
import Link from 'next/link';
import type { PseoCategory } from '@/libs/pseo/data';
import { getSiteUrl } from '@/libs/seo/config';
```

```tsx
// Before (line 40)
...(item.href && { item: `${process.env.NEXT_PUBLIC_APP_URL || ''}${item.href}` }),

// After
...(item.href && { item: `${getSiteUrl()}${item.href}` }),
```

---

## Related Findings

### F-090
- **Severity**: P1
- **File**: `src/features/landing/CenteredHero.tsx`
- **Line**: 10-12
- **Title**: Hero title rendered as div instead of h1
- **Description**: Landing page has no h1. Violates WCAG 2.4.6 and harms search ranking.
- **Suggestion**: Change div to h1. Update Section.tsx to use h2 for section titles.

### F-091
- **Severity**: P1
- **File**: `src/templates/Footer.tsx`
- **Line**: 20-74
- **Title**: Footer social icon links have no accessible text (WCAG 2.4.4)
- **Description**: Seven SVG-only links with no aria-label, aria-hidden, or title element.
- **Suggestion**: Add aria-label per link ("Follow us on GitHub"). Add aria-hidden="true" on SVGs.

### F-092
- **Severity**: P1
- **File**: `src/features/landing/CenteredMenu.tsx`
- **Line**: 21-45
- **Title**: Landing page navbar missing nav landmark and logo has no accessible label
- **Description**: No `<header>` or `<nav>` wrapping the full component. Logo link has no aria-label. The inner `<nav>` (line 28) exists for menu items only but the outer wrapper is a plain `div`.
- **Suggestion**: Change outer `div` to `<header>`. Add `aria-label="Main navigation"` to existing inner `<nav>`. Add `aria-label="Go to homepage"` to logo link.

### F-094
- **Severity**: P1
- **File**: `src/components/layout/MainAppShell.tsx`
- **Line**: 285
- **Title**: Mobile header h1 "VT SaaS Template" creates duplicate h1 on every authenticated page
- **Description**: Every page using MainAppShell has this persistent h1 conflicting with page-specific h1s.
- **Suggestion**: Change h1 to span.

### F-095
- **Severity**: P1
- **File**: `src/components/ui/toast.tsx`
- **Line**: 65-78
- **Title**: Toast close button has no accessible label (WCAG 4.1.2)
- **Description**: ToastClose renders X icon with no aria-label or visually hidden text.
- **Suggestion**: Add aria-label="Dismiss notification".

### F-096
- **Severity**: P1
- **File**: `src/app/[locale]/layout.tsx`
- **Line**: 44-73
- **Title**: Root layout missing canonical URL tag for homepage
- **Description**: alternates.languages is set for hreflang but alternates.canonical is absent. Search engines may index prefixed and unprefixed versions as separate pages.
- **Suggestion**: Add `alternates.canonical` using getSiteUrl() in generateMetadata.

### F-097
- **Severity**: P2
- **File**: `src/styles/global.css`
- **Line**: 40-58
- **Title**: Animations lack prefers-reduced-motion media query (WCAG 2.3.3)
- **Description**: Accordion animations defined via @keyframes and Tailwind transition-* utilities have no motion-reduce guards.
- **Suggestion**: Add @media (prefers-reduced-motion: reduce) block with blanket animation/transition overrides.

### F-098
- **Severity**: P2
- **File**: `src/components/ui/password-input.tsx`
- **Line**: 29
- **Title**: Password reveal button uses tabIndex=-1, unreachable by keyboard (WCAG 2.1.1)
- **Description**: Keyboard-only users cannot toggle password visibility. The aria-label is already correct; only tabIndex is the problem.
- **Suggestion**: Remove tabIndex={-1}.

### F-099
- **Severity**: P2
- **File**: `src/components/layout/MainAppShell.tsx`
- **Line**: 276-295
- **Title**: Missing skip-to-main-content link (WCAG 2.4.1)
- **Description**: No skip navigation link anywhere in the application. Keyboard users must tab through the entire sidebar on every page load.
- **Suggestion**: Add visually-hidden skip link as first child of body/shell. Add id="main-content" to the existing main element.

### F-100
- **Severity**: P2
- **File**: `src/components/pseo/Breadcrumbs.tsx`
- **Line**: 40
- **Title**: BreadcrumbList structured data uses undefined NEXT_PUBLIC_APP_URL
- **Description**: Uses `process.env.NEXT_PUBLIC_APP_URL` which is not defined in this project (project uses `NEXT_PUBLIC_SITE_URL`). This produces empty-string base URLs in schema.org JSON-LD, making all breadcrumb item URLs invalid.
- **Suggestion**: Replace with getSiteUrl() from @/libs/seo/config.

---

## Affected Files (Validated)

All files confirmed to exist on disk:

| File | Status | Finding(s) |
|---|---|---|
| `src/features/landing/CenteredHero.tsx` | EXISTS — line 10 is `<div>` wrapping title | F-090 |
| `src/features/landing/Section.tsx` | EXISTS — line 21 is `<div>` wrapping title | F-090 |
| `src/templates/Footer.tsx` | EXISTS — 7 icon links at lines 21-74, no aria-labels | F-091 |
| `src/features/landing/CenteredMenu.tsx` | EXISTS — outer wrapper is `<div>`, logo link has no aria-label | F-092 |
| `src/components/layout/MainAppShell.tsx` | EXISTS — line 285 is `<h1>`, line 289 is `<main>` with no id | F-094, F-099 |
| `src/components/ui/toast.tsx` | EXISTS — ToastClose has no aria-label at line 65 | F-095 |
| `src/app/[locale]/layout.tsx` | EXISTS — alternates has languages but no canonical | F-096 |
| `src/styles/global.css` | EXISTS — accordion keyframes at lines 40-58, no reduced-motion block | F-097 |
| `src/components/ui/password-input.tsx` | EXISTS — tabIndex={-1} at line 29 | F-098 |
| `src/components/pseo/Breadcrumbs.tsx` | EXISTS — NEXT_PUBLIC_APP_URL at line 40 | F-100 |

**Stale Entries**: None. All 10 files exist and findings are accurate.

**Additional Observation (F-092)**: The component at `src/features/landing/CenteredMenu.tsx` already has an inner `<nav>` element at line 28. The finding references "missing nav landmark" in the sense that the outer container and logo link lack semantic roles. The fix is to change the outer `<div>` to `<header>` and add `aria-label` to the existing `<nav>` and to the logo `<Link>`. No new `<nav>` is needed.

**Additional Observation (F-096)**: `getSiteUrl()` is exported from `src/libs/seo/config.ts` and is already used by `generateSocialMetadata`. It is safe to import directly in `layout.tsx`.

---

## Test Requirements

### Tests Before (Characterization)

Coverage gate is ADEQUATE — just run:
```bash
npm test
```

Confirm the test suite passes before making any changes.

### Tests After (Verification)

#### 1. Automated accessibility smoke test (axe-core)

Install `@axe-core/playwright` if not already present, then add a test file (e.g., `tests/accessibility.spec.ts`) covering the three key pages:

```typescript
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test('landing page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('sign-in page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/en/sign-in');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('dashboard has no critical accessibility violations', async ({ page }) => {
  // Requires authenticated session; use existing test credentials
  await page.goto('/en/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

#### 2. Canonical tag verification

In the Playwright test or via a quick manual curl check:
```typescript
test('landing page renders canonical tag', async ({ page }) => {
  await page.goto('/');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).not.toBeNull();
  expect(canonical).toMatch(/^https?:\/\//);
});
```

#### 3. H1 count check (exactly one h1 per page)

```typescript
test('landing page has exactly one h1', async ({ page }) => {
  await page.goto('/');
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);
});

test('dashboard page has at most one h1', async ({ page }) => {
  await page.goto('/en/dashboard');
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeLessThanOrEqual(1);
});
```

#### 4. Skip link presence

```typescript
test('app shell renders skip-to-main-content link', async ({ page }) => {
  await page.goto('/en/dashboard');
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toHaveCount(1);
  const mainContent = page.locator('#main-content');
  await expect(mainContent).toHaveCount(1);
});
```

#### 5. Breadcrumb structured data URL validity

Manual check after deployment: view source on an article page and verify `@type: BreadcrumbList` item URLs begin with the site domain rather than an empty string.

#### 6. Unit tests — run full suite after changes

```bash
npm test
npm run check-types
npm run lint
```

---

## Enrichment Notes

- **UI Changes**: true (CenteredHero, Section, CenteredMenu, Footer, MainAppShell, toast, password-input all render visible UI)
- **Stale Files Removed**: None
- **Gaps Found**:
  - F-092 finding says "no `<nav>` wrapping" but the component already has an inner `<nav>` at line 28. The actual gap is the outer `<div>` (should be `<header>`) and missing `aria-label` on that `<nav>` and logo link. Step 3 above corrects the guidance accordingly.
  - The `ToggleMenuButton` component (referenced in F-092) was not in the finding's file list. Verify it already has an `aria-label` or `aria-expanded` prop; if not, also add `aria-label="Toggle navigation menu"` to the `ToggleMenuButton` call site in `CenteredMenu.tsx`.
  - F-096 canonical suggestion is for the root layout only. Individual page `generateMetadata()` functions should also set `alternates.canonical` — this is outside T-006 scope but worth noting for future work.
  - Password input button (F-098) already has a correct dynamic `aria-label` (lines 28-29 of `password-input.tsx`). The only change required is removing `tabIndex={-1}`.
