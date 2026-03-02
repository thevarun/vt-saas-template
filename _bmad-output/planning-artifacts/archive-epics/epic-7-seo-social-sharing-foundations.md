# Epic 7: SEO & Social Sharing Foundations

**Goal:** Product is discoverable; content is shareable with rich previews

## Story 7.1: Internationalization SEO (hreflang)

As a **search engine crawler**,
I want **to understand language variants of pages**,
So that **users are shown the right language version in search results**.

**Acceptance Criteria:**

**Given** any public page on the site
**When** I view the page source
**Then** I see hreflang link tags for all supported languages
**And** tags include: en, hi, bn (all supported locales)
**And** tags include x-default pointing to English version

**Given** the hreflang implementation
**When** I review the code
**Then** alternates are configured in layout.tsx or page metadata
**And** Next.js Metadata API is used correctly
**And** URLs are absolute (including domain)

**Given** the landing page at /en
**When** I inspect hreflang tags
**Then** I see `<link rel="alternate" hreflang="en" href="https://example.com/en" />`
**And** I see `<link rel="alternate" hreflang="hi" href="https://example.com/hi" />`
**And** I see `<link rel="alternate" hreflang="bn" href="https://example.com/bn" />`
**And** I see `<link rel="alternate" hreflang="x-default" href="https://example.com/en" />`

**Given** any localized page (e.g., /hi/about)
**When** I check hreflang tags
**Then** alternates point to correct localized versions
**And** self-referential hreflang is included
**And** URLs match actual page paths

**Given** authenticated pages (dashboard, settings)
**When** I check for hreflang
**Then** hreflang tags are NOT present (or pages are noindex)
**And** only public pages have language alternates

---

## Story 7.2: Open Graph & Twitter Card Metadata

As a **user sharing the app on social media**,
I want **rich previews with images and descriptions**,
So that **my shares look professional and informative**.

**Acceptance Criteria:**

**Given** the landing page
**When** I share on Facebook/LinkedIn
**Then** Open Graph preview shows: title, description, image
**And** title is the app name or page title
**And** description is compelling and accurate
**And** image is the default OG image (1200x630)

**Given** the landing page
**When** I share on Twitter
**Then** Twitter Card preview shows: title, description, image
**And** card type is "summary_large_image"
**And** image displays correctly in timeline

**Given** page metadata
**When** I review the root layout
**Then** default openGraph config is set
**And** default twitter config is set
**And** site name, type, and images are configured

**Given** individual pages
**When** they have specific metadata
**Then** page-specific OG overrides default
**And** titles include page name + site name
**And** descriptions are page-appropriate

**Given** the OG image configuration
**When** I check image URLs
**Then** default OG image exists at /og-image.png or similar
**And** image is 1200x630 pixels
**And** image includes app branding
**And** URL is absolute

**Given** metadata validation
**When** I test with Facebook Sharing Debugger
**Then** no errors or warnings appear
**And** preview renders correctly
**When** I test with Twitter Card Validator
**Then** card renders correctly

---

## Story 7.3: Robots.txt & Sitemap Configuration

As a **search engine crawler**,
I want **clear indexing instructions**,
So that **I index public pages and avoid private ones**.

**Acceptance Criteria:**

**Given** robots.txt at /robots.txt
**When** I view the file
**Then** it allows crawling of public pages
**And** it disallows /dashboard, /admin, /api paths
**And** it references the sitemap location
**And** format follows standard robots.txt spec

**Given** the robots.txt content
**When** I review the rules
**Then** I see `User-agent: *`
**And** I see `Allow: /`
**And** I see `Disallow: /dashboard`
**And** I see `Disallow: /admin`
**And** I see `Disallow: /api`
**And** I see `Sitemap: https://example.com/sitemap.xml`

**Given** the sitemap at /sitemap.xml
**When** I view the sitemap
**Then** it lists all public pages
**And** it includes localized versions of pages
**And** each URL has lastmod, changefreq (optional)
**And** format is valid XML sitemap

**Given** the sitemap implementation
**When** I review the code
**Then** sitemap is generated via `src/app/sitemap.ts`
**And** sitemap is dynamically generated (not static file)
**And** new public pages are automatically included

**Given** authenticated routes
**When** I check the sitemap
**Then** /dashboard, /admin, /settings are NOT listed
**And** only publicly accessible pages are included

**Given** localized pages in sitemap
**When** I review entries
**Then** each page appears with all locale variants
**And** alternates are properly linked
**And** URLs are absolute with domain

---

## Story 7.4: Dynamic Open Graph Images

As a **user sharing specific content**,
I want **dynamically generated preview images**,
So that **shared links have contextual, branded previews**.

**Acceptance Criteria:**

**Given** the OG image generation endpoint
**When** I access /api/og or /og/[...path]
**Then** an image is generated on the edge
**And** image is returned as PNG
**And** generation is fast (< 500ms)

**Given** the default OG image
**When** generated without parameters
**Then** image shows app name/logo
**And** image uses brand colors
**And** image is 1200x630 pixels
**And** text is readable and well-positioned

**Given** page-specific OG images
**When** a page passes title parameter
**Then** image includes the page title
**And** layout adapts to title length
**And** branding elements remain consistent

**Given** the OG image template
**When** I review the implementation
**Then** @vercel/og (or similar) is used
**And** template is in `src/app/api/og/route.tsx` or similar
**And** template uses JSX for layout
**And** fonts are properly loaded

**Given** customization needs
**When** I want to modify OG image design
**Then** template is clearly structured
**And** colors reference brand variables
**And** logo/assets are easily swappable
**And** documentation explains customization

**Given** OG image caching
**When** same parameters are requested
**Then** images are cached at edge
**And** cache headers are properly set
**And** regeneration happens on deploy or param change

**Given** error handling
**When** OG generation fails
**Then** fallback to static default image
**And** error is logged
**And** user doesn't see broken image

---
