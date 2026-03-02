# Epic 1: Template Foundation & Modernization

**Goal:** Template users get a clean, upgraded foundation ready for customization

## Story 1.1: Upgrade Next.js to Version 15

As a **template user (developer)**,
I want **the template upgraded to Next.js 15**,
So that **I have access to the latest framework features and performance improvements**.

**Acceptance Criteria:**

**Given** the current Next.js 14 installation
**When** I upgrade to Next.js 15
**Then** the package.json shows next@15.x
**And** all page components use async params/searchParams patterns
**And** `npm run build` completes with 0 errors
**And** `npm run dev` starts without errors
**And** all existing routes render correctly

**Given** any page using params or searchParams
**When** I review the component code
**Then** params and searchParams are awaited before use
**And** TypeScript types are updated for async params

---

## Story 1.2: Upgrade React to Version 19

As a **template user (developer)**,
I want **the template upgraded to React 19**,
So that **I can use the latest React features and patterns**.

**Acceptance Criteria:**

**Given** the current React 18 installation
**When** I upgrade to React 19
**Then** the package.json shows react@19.x and react-dom@19.x
**And** all components render without errors
**And** no console warnings about deprecated patterns
**And** Server Components continue to work correctly
**And** Client Components with hooks function properly

**Given** any component using useEffect or other hooks
**When** I test the component
**Then** hook behavior matches React 19 expectations
**And** cleanup functions execute correctly

---

## Story 1.3: Upgrade Supabase SDK & Auth Patterns

As a **template user (developer)**,
I want **the Supabase SDK upgraded to the latest version**,
So that **I have the most secure and feature-complete auth integration**.

**Acceptance Criteria:**

**Given** the current Supabase SDK installation
**When** I upgrade to the latest @supabase/supabase-js
**Then** the package.json shows the latest stable version
**And** browser client factory works correctly
**And** server client factory works correctly
**And** middleware client factory works correctly

**Given** a user attempting to sign in
**When** they submit valid credentials
**Then** session is created and stored in cookies
**And** user is redirected to dashboard
**And** session refresh works automatically

**Given** a protected route
**When** an unauthenticated user attempts access
**Then** they are redirected to sign-in page
**And** middleware correctly validates session

---

## Story 1.4: Upgrade TypeScript & Fix Type Errors

As a **template user (developer)**,
I want **TypeScript upgraded to 5.7+ with all type errors resolved**,
So that **I have the best type safety and developer experience**.

**Acceptance Criteria:**

**Given** the current TypeScript installation
**When** I upgrade to TypeScript 5.7+
**Then** the package.json shows typescript@5.7.x or higher
**And** `npm run check-types` passes with 0 errors
**And** strict mode remains enabled in tsconfig.json
**And** no type assertions added just to silence errors

**Given** any component or utility file
**When** I hover over variables in VS Code
**Then** type inference is accurate and helpful
**And** no `any` types introduced during upgrade

---

## Story 1.5: Rebrand to VT SaaS Template

As a **template user (developer)**,
I want **all HealthCompanion references replaced with VT SaaS Template**,
So that **the template is ready for customization without domain-specific content**.

**Acceptance Criteria:**

**Given** a search for "HealthCompanion" in the codebase
**When** I search all files (excluding node_modules, .git)
**Then** zero matches are found
**And** all instances replaced with "VT SaaS Template" or generic equivalent

**Given** the application metadata
**When** I check page titles, descriptions, and OG tags
**Then** they reflect "VT SaaS Template" branding
**And** no health-specific messaging remains

**Given** any UI text visible to users
**When** I review the application
**Then** content is generic/placeholder
**And** suitable for any SaaS use case

**Given** the README and documentation
**When** I review docs
**Then** project is described as "VT SaaS Template"
**And** setup instructions are template-focused

---

## Story 1.6: Validate & Enhance Error Boundaries

As a **user of applications built with this template**,
I want **graceful error handling that prevents white screens**,
So that **I can recover from errors without losing my work**.

**Acceptance Criteria:**

**Given** a React error in any component
**When** the error occurs during rendering
**Then** the nearest error boundary catches it
**And** a user-friendly fallback UI is displayed
**And** the error is logged to Sentry (if configured)

**Given** the application structure
**When** I review error boundary placement
**Then** boundaries exist at app level (global fallback)
**And** boundaries exist at route level (page isolation)
**And** boundaries exist for critical component groups

**Given** an error boundary fallback
**When** a user sees the error UI
**Then** they can attempt to recover (retry/refresh)
**And** they can navigate to a safe page
**And** the message is helpful, not technical

---

## Story 1.7: Standardize API Error Handling

As a **developer consuming API endpoints**,
I want **consistent error response format across all APIs**,
So that **I can handle errors predictably in my frontend code**.

**Acceptance Criteria:**

**Given** any API endpoint returning an error
**When** the error response is sent
**Then** it follows the format `{ error: string, code: string, details?: object }`
**And** HTTP status codes are used correctly (400, 401, 403, 404, 500)

**Given** a validation error on API input
**When** the request contains invalid data
**Then** response is 400 Bad Request
**And** `details` contains field-level error information
**And** error message is user-friendly

**Given** an authentication error
**When** the user is not authenticated
**Then** response is 401 Unauthorized
**And** `code` is "UNAUTHORIZED"

**Given** an authorization error
**When** the user lacks permission
**Then** response is 403 Forbidden
**And** `code` is "FORBIDDEN"

---

## Story 1.8: Validate CI/CD Pipeline

As a **template user (developer)**,
I want **a working CI/CD pipeline that catches issues before deployment**,
So that **I can deploy with confidence**.

**Acceptance Criteria:**

**Given** a push to any branch
**When** GitHub Actions workflow triggers
**Then** ESLint check runs and passes
**And** TypeScript check runs and passes
**And** Unit tests run and pass
**And** Build completes successfully

**Given** a pull request to main branch
**When** the PR is created
**Then** all checks must pass before merge is allowed
**And** preview deployment is created on Vercel

**Given** a merge to main branch
**When** the merge completes
**Then** production deployment triggers automatically
**And** deployment completes successfully on Vercel

**Given** the CI/CD configuration
**When** I review the workflow files
**Then** build artifacts are cached for performance
**And** environment variables are properly configured

---

## Story 1.9: Validate Existing Features Post-Upgrade

As a **template user (developer)**,
I want **confirmation that existing features work after all upgrades**,
So that **I know the template is stable and production-ready**.

**Acceptance Criteria:**

**Given** the dark mode toggle
**When** I switch between light and dark modes
**Then** the theme changes correctly throughout the app
**And** preference is persisted across page refreshes
**And** system preference detection works

**Given** the language switcher
**When** I change language to Hindi or Bengali
**Then** all UI text updates to the selected language
**And** URL reflects the locale prefix
**And** preference is persisted

**Given** the responsive design
**When** I resize the browser to mobile width (<768px)
**Then** layout adapts correctly
**And** navigation transforms to mobile pattern
**And** touch targets are appropriately sized (44x44px)

**Given** the tablet viewport (768-1024px)
**When** I view the application
**Then** layout adapts for tablet
**And** all features remain accessible

**Given** Lighthouse audit
**When** I run Lighthouse on key pages
**Then** Performance score is ≥ 90
**And** Accessibility score is ≥ 90
**And** Best Practices score is ≥ 90

---
