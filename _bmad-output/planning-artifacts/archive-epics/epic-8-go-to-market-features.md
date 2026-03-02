# Epic 8: Go-To-Market Features

**Goal:** Pre-launch and growth infrastructure ready for product launches

**Parallel Development Notes:**
- Epic 8 can run in parallel with Epic 9
- **Shared file**: `sitemap.ts` — Epic 8 adds pSEO routes, Epic 9 does not touch it
- **Analytics hook points**: Stories should include clearly marked TODO comments where analytics events will be wired (event name + properties documented). Do NOT import analytics utilities — Epic 9 handles that.
- **Dependency**: Story 9.6 (pSEO instrumentation) depends on 8.5 completion

## Story 8.1: Share Widget Component

As a **user who wants to share the product**,
I want **an easy way to share on social platforms**,
So that **I can spread the word with minimal effort**.

**Acceptance Criteria:**

**Given** the ShareWidget component
**When** I use it in any page
**Then** it displays share buttons for major platforms
**And** platforms include: Twitter/X, LinkedIn, Facebook, Copy Link
**And** buttons have recognizable platform icons

**Given** I click a social share button
**When** the share action triggers
**Then** platform's share dialog opens
**And** pre-filled text includes page title/description
**And** URL being shared is the current page (or specified URL)

**Given** I click "Copy Link"
**When** the action completes
**Then** URL is copied to clipboard
**And** I see confirmation feedback ("Copied!")
**And** feedback auto-dismisses after 2 seconds

**Given** the ShareWidget component props
**When** I review the API
**Then** component accepts: url, title, description (optional)
**And** component accepts: platforms (array to customize which buttons)
**And** component accepts: variant (inline, popup, minimal)

**Given** the ShareWidget on mobile
**When** I view on small screens
**Then** native share API is used if available
**And** fallback to platform buttons if not
**And** buttons are touch-friendly

**Given** share analytics hook points
**When** I review the component code
**Then** each share click location has a documented analytics hook point
**And** hook point documents: event name (`share_clicked`), properties (`platform`, `url`, `page`)
**And** actual event firing is wired in Epic 9 instrumentation

---

## Story 8.2: Private Shareable URLs

As a **user who wants to share private content**,
I want **to generate secure, shareable links**,
So that **I can share content with specific people**.

Template pattern — example use cases include published reports, public profile views, shared dashboards. Developers replace with their specific resource types.

**Acceptance Criteria:**

**Given** shareable content (e.g., a report, document)
**When** I click "Publish"
**Then** a unique URL is generated
**And** URL contains a random, unguessable token
**And** URL is displayed with copy button

**Given** the shareable URL schema
**When** I review the database
**Then** table exists: shareable_links
**And** fields include: id, token, resource_type, resource_id, created_by
**And** fields include: expires_at, access_count, is_active

**Given** I create a share link
**When** I configure options
**Then** I can revoke the link later

**Given** someone accesses a share link
**When** the link is valid
**Then** they see the shared content
**And** access_count is incremented
**And** no authentication required — these are public view-only pages

**Given** an expired or revoked link
**When** someone tries to access it
**Then** they see "This link has expired" message
**And** content is not displayed
**And** they may see option to request new link

**Given** share link management
**When** I view my shared links
**Then** I see list of links I've created
**And** I can revoke any active link

---

## Story 8.3: Changelog Release Automation

As a **product owner**,
I want **releases auto-generated from commits**,
So that **I don't manage versions manually**.

**Acceptance Criteria:**

**Given** a GitHub release is published
**When** the release event triggers
**Then** GitHub Action workflow runs
**And** workflow extracts release notes
**And** workflow prepares content for publishing

**Given** the changelog workflow
**When** I review .github/workflows/changelog.yml
**Then** workflow triggers on: push to main
**And** workflow extracts: version, date, notes
**And** workflow formats content appropriately

**Given** semantic-release configuration
**When** I review the release automation
**Then** uses `semantic-release` for automated versioning
**And** versioning follows semver (`MAJOR.MINOR.PATCH`)
**And** version auto-determined from Conventional Commit messages
**And** `feat:` → minor bump, `fix:` → patch bump
**And** `BREAKING CHANGE` footer → major bump (manual/intentional)

**Given** release output
**When** semantic-release runs on push to main
**Then** GitHub Release created automatically with generated notes
**And** release notes grouped by commit type (features, fixes, etc.)
**And** content is saved to `docs/changelog/` or similar

**Given** content output options
**When** workflow completes
**Then** optionally: webhook is called (for n8n/Zapier)
**And** optionally: PR is created with new content

---

## Story 8.4: Changelog Page

As a **visitor**,
I want **to see a changelog page**,
So that **I can follow product updates**.

**Acceptance Criteria:**

**Given** the changelog page
**When** I visit /changelog
**Then** I see list of releases
**And** releases are sorted newest first
**And** each entry shows version, date, categorized changes

**Given** content updates
**When** new releases are added to `docs/changelog/`
**Then** page auto-updates with new entries

**Given** minimal initial implementation
**When** I review the scope
**Then** renders markdown files from changelog directory
**And** basic layout is functional and readable

---

## Story 8.5: Programmatic SEO Page Generation

As a **growth-focused product owner**,
I want **to generate SEO pages from data**,
So that **I can capture long-tail search traffic**.

**Acceptance Criteria:**

**Given** programmatic SEO needs
**When** I want to create data-driven pages
**Then** there is a pattern for dynamic route generation
**And** pattern uses Next.js dynamic routes
**And** pattern is documented with examples

**Given** a pSEO page template
**When** I create pages from data
**Then** route structure is /[category]/[slug] or similar
**And** pages are statically generated at build time
**And** pages have proper metadata (title, description, OG)

**Given** the pSEO data source
**When** I configure pages
**Then** data comes from JSON files in /data directory
**And** or data comes from API/database
**And** generateStaticParams is used for static generation

**Given** an example pSEO implementation
**When** I review the code
**Then** example exists in src/app/[locale]/(pseo)/
**And** example demonstrates: data loading, template, metadata
**And** example is well-commented for learning

**Given** pSEO pages in sitemap
**When** sitemap is generated
**Then** pSEO pages generate a nested sitemap index for scalability
**And** sitemap updates automatically when new data is added

**Given** pSEO page content and navigation
**When** I view a generated page
**Then** content is unique and valuable (not thin)
**And** page passes basic SEO checks
**And** pages include breadcrumb navigation reflecting category hierarchy
**And** pages include a "Related Pages" section linking to same-category pages
**And** link generation uses data model relationships (not hardcoded)

**Given** analytics hook points
**When** I review the pSEO page code
**Then** page view and engagement event locations are documented with TODO comments
**And** hook points document: event names and properties
**And** actual analytics imports and event firing are NOT included (handled by Epic 9)

**Given** customization needs
**When** I want to create my own pSEO pages
**Then** documentation explains the pattern
**And** example template is easy to copy/modify
**And** data format is clearly specified

---
