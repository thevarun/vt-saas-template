# Component Inventory

**Generated:** 2026-07-03 | Deep scan

Reference for the React component and hooks layer (Next.js 16 App Router, React 19, shadcn/ui, Tailwind v4).

## Overview & counts

| Metric | Count |
|---|---|
| Non-test `.tsx` files (`src/`) | **~235** |
| Files with `'use client'` | **121** (~51%) |
| Server / RSC `.tsx` (no directive) | **~114** |
| shadcn/ui primitives (`src/components/ui/`) | **43** |

RSC-first: pages, layouts, and static marketing/legal content render on the server; interactivity (dialogs, forms, chat, theme, admin tables) opts into `'use client'`.

**Component homes:** `src/components/ui/` (shadcn primitives) · `src/components/<domain>/` (feature components) · `src/features/landing/` (landing section primitives) · `src/templates/` (assembled marketing sections) · `src/hooks/` + `src/libs/hooks/` (hooks).

---

## shadcn/ui primitives (`src/components/ui/`)

Standard shadcn/ui set on Radix + `class-variance-authority`. Variant maps live in sibling `*Variants.ts` files (`buttonVariants.ts`, `badgeVariants.ts`, `toggle-variants.ts`, …) so component files export only components (Fast-Refresh-safe).

`accordion` · `alert` · `alert-dialog` · `avatar` · `badge` · `button` · `calendar` · `card` · `carousel` · `chart` · `checkbox` · `close-button` · `collapsible` · `command` · `data-table` · `dialog` · `drawer` · `dropdown-menu` · `EmptyState` · `form` · `input` · `label` · `loading-card` · `navigation-menu` · `password-input` · `popover` · `progress` · `resizable` · `scroll-area` · `select` · `separator` · `sheet` · `skeleton` · `spinner` · `switch` · `table` · `tabs` · `textarea` · `toast` · `toaster` · `toggle` · `toggle-group` · `tooltip`

Helper: `useFormField.ts` (form-field context, extracted from `form.tsx`). Toast has both the shadcn `toast`/`toaster` primitives and a `sonner`-based path used by newer flows (auth-dialog imports `toast` from `sonner`).

---

## Categorized inventory

### Layout & app shell
`layout/MainAppShell.tsx` (authenticated sidebar shell), `layout/NavItem.tsx`, `UserProfileSection.tsx`, `LanguageSelector.tsx`, `page-header.tsx`, `chat/AppShell.tsx`, `ActiveLink.tsx`, `ToggleMenuButton.tsx`, `LocaleSwitcher.tsx`, `Background.tsx`, `reveal.tsx`.

### Marketing (the `(marketing)` route-group shell)
The live marketing shell is the **`(marketing)` route group** under `src/app/[locale]/(unauth)/`. Its `layout.tsx` provides `AuthDialogProvider` + `MarketingNavbar` + `MarketingFooter`; the landing `page.tsx` composes `@/templates` (`Hero`, `Features`, `CTA`, `FAQ`) and mounts `AuthDialogAutoOpener` in `<Suspense>`.

| Component | Notes |
|---|---|
| `marketing/navbar.tsx`, `marketing/footer.tsx` | Shell nav + footer |
| `marketing/auth-dialog.tsx` | Overlay auth dialog + `AuthDialogProvider`/`useAuthDialog` + `AuthDialogAutoOpener` (reads `?auth=signin\|signup&redirect=`) |
| `marketing/marketing-theme-scope.tsx` | Mirrors marketing theme class onto `<body>` so Radix portals inherit the marketing palette |
| `templates/Hero.tsx`, `Features.tsx`, `CTA.tsx`, `FAQ.tsx`, `Logo.tsx` | Assembled sections |
| `features/landing/*` | `Container`, `Section`, `SectionHeading`, `CenteredHero`, `FeatureCard`, `LogoCloud`, `CTABanner`, `StickyBanner` — server components; `Container` standardizes `mx-auto max-w-* px-4` |
| `blog/blog-card.tsx` | `BlogCard` |
| `legal/legal-toc.tsx` | TOC for terms/privacy |
| `pseo/*` | `PseoTemplate`, `Breadcrumbs`, `RelatedPages`, `mdx-components` |

### Auth
`auth/social-auth-buttons.tsx` (uses `useOAuth`), `auth/AccessDeniedToast.tsx`, `auth/VerificationToast.tsx`, `marketing/auth-dialog.tsx` (overlay), route-level `sign-in/SignInFormClient.tsx`.

### Chat — two stacks behind `/chat`
- **Dify:** `chat/ChatOptionCard.tsx`, `ChatInterface.tsx`, `Thread.tsx`, `ThreadView.tsx`, `ThreadItem.tsx`, `ThreadListSidebar.tsx`, `ThreadListSkeleton.tsx`, `ThreadTitleEditor.tsx`, `EmptyThreadState.tsx`, `ErrorThreadState.tsx`, `TypingIndicator.tsx`.
- **Vercel AI SDK:** `chat/vercel/VercelChatInterface.tsx`, `ConversationListSidebar.tsx`, `ConversationItem.tsx`.

### Admin
Shell: `admin/AdminLayoutClient.tsx`, `AdminHeader.tsx`, `AdminSidebar.tsx` (body-scoped `[data-admin]` theming). Users: `UserTable`, `UserDetailDialog`, `AssignTierDialog`, `SuspendUserDialog`, `DeleteUserDialog`, `ResetPasswordDialog`, `BulkPromotionInviteDialog`. Feedback: `FeedbackList`, `FeedbackCard`, `FeedbackDetailDialog`, `FeedbackFilters`. Audit: `AuditLogTable`, `AuditLogFilters`. Utility: `MetricCard`, `Pagination`, `ExportCsvButton`, `EmailTestForm`. Analytics sub-dashboard (`admin/analytics/`): `AnalyticsDashboard`, `AnalyticsMetricCard`, `CompletionRatesCard`, `SignupsChart` + skeletons.

### Dashboard / Settings / Onboarding
`dashboard/WelcomeDashboard.tsx`, `dashboard/ActionCard.tsx`; `settings/notifications-section.tsx`; `onboarding/OnboardingUsername.tsx`, `UsernameInput.tsx`, `OnboardingPreferences.tsx`, `OnboardingFeatureTour.tsx`, `ProgressIndicator.tsx`.

### Subscriptions / Billing
`subscriptions/tier-card.tsx`, `plan-gate-dialog.tsx`, `expiry-banner.tsx`, `trial-status-pill.tsx` (data via `useSubscriptionUsage`).

### Forms
Built on `ui/form.tsx` (react-hook-form + Zod via `@hookform/resolvers`) + `useFormField`. Instances: auth-dialog, `SignInFormClient`, `UsernameInput`, `settings/notifications-section`, admin dialogs, `EmailTestForm`. Specialized inputs: `ui/password-input`, `ui/input`, `ui/textarea`.

### Feedback / Errors / Empty states
`feedback/FeedbackTrigger.tsx`, `feedback/FeedbackModal.tsx`; `errors/ErrorBoundary.tsx`, `errors/ErrorFallback.tsx` (+ per-segment `error.tsx`); `ui/EmptyState`, `loading-card`, `skeleton`, `spinner`, `toast`/`toaster`.

### Theme (multi-theme, OKLCH)
| Component | Notes |
|---|---|
| `theme/ThemeProvider.tsx` | Wraps `next-themes` (`attribute="class"`, `defaultTheme="system"`); registers all 8 theme ids. `DarkClassSync` toggles `.dark` on `<html>` for any `*-dark` theme so Tailwind's `dark:` works |
| `theme/ThemeToggle.tsx` | Grouped dropdown picker: color swatch per family, sun/moon per variant, check on active, plus System |
| `theme/theme-config.ts` | Type-safe registry: `ThemeId` union, `THEME_GROUPS` (Default, Modern SaaS, Warm Sand, Sage Green), `ALL_THEME_IDS`, `isDarkTheme()` |

### Providers & Analytics
`providers/query-provider.tsx` (TanStack Query); `analytics/PostHogProvider.tsx`, `UserIdentifier.tsx`, `LandingPageTracker.tsx`, `SignupCompletedTracker.tsx`.

### Share
`share/ShareWidget.tsx`, `ShareLinkModal.tsx`, `ShareLinksTable.tsx`, `platformIcons.tsx`.

---

## Custom hooks

### `src/hooks/`
| Hook | Purpose |
|---|---|
| `useUser` | Current authenticated Supabase user; returns null during load to avoid flicker |
| `useOAuth` | Shared OAuth sign-in/sign-up handlers, optional `next` redirect |
| `useUsernameValidation` | Debounced (300ms) async username availability/format check |
| `useMenu` | Toggle state for responsive menus |
| `use-toast` | shadcn toast state/dispatcher powering `ui/toaster` |

### `src/libs/hooks/`
| Hook | Purpose |
|---|---|
| `useConfetti` | Confetti celebration effect |
| `useDebounce` | Generic value debounce (default 500ms) |
| `useIsMobile` | Boolean for viewport under a breakpoint (default 768px) |
| `useTypewriterPlaceholder` | Cycling typewriter placeholder text |
| `useAdminAnalytics` | Admin analytics metrics (shared query key) |
| `useItem` / `useItems` | TanStack read hooks for the generic `item` entity exemplar |
| `useItemMutations` | Wraps item server actions + owns cache invalidation |
| `useSubscriptionUsage` / `useInvalidateSubscriptionUsage` | Subscription + tier + quota + usage; powers expiry banner, trial pill, plan cards |
| `useUserPreferences` / `useUpdateUserPreferences` | Read/write user preferences |
| `useUserSubscriptionDetail` | Single user's subscription summary for the admin detail panel |

### Other locations
| Hook | Location | Purpose |
|---|---|---|
| `useKeyboardShortcuts` | `libs/keyboard/` | Global keyboard shortcuts (once in app shell) |
| `useTour` | `libs/tours/` | driver.js product tour per `TourId`, persisted per user |
| `usePseoTracking` | `libs/analytics/hooks/` | Tracks pSEO page views on mount |
| `useFormField` | `components/ui/` | Form-field context for `ui/form.tsx` |

### Zustand stores (hook-shaped)
`useAuthDialog` (auth-dialog context), `useEditorStore`/`useEditorUIStore`/`useEditorStoreApi`, `useEntityDialogStore`, `useKeyboardShortcutStore`.

---

## Notable patterns

- **Design system:** shadcn/ui + Tailwind v4 (`cn()` from `@/utils/Helpers`), Radix primitives, CVA variant maps split into `*Variants.ts` siblings so component modules stay Fast-Refresh-safe.
- **Theming (multi-theme, OKLCH):** `next-themes` with `attribute="class"`. A type-safe registry (`theme-config.ts`) drives 4 families × light/dark = 8 themes; each id maps to a CSS class in `src/styles/global.css` (OKLCH). `DarkClassSync` bridges custom `*-dark` themes to Tailwind's `.dark`. Portalled overlays get the correct palette via body-scoping (`MarketingThemeScope` for marketing, `[data-admin]` for admin).
- **RSC-first:** server by default; `'use client'` reserved for interactivity.
- **Reusable primitives:** `Container`/`Section`/`SectionHeading` standardize marketing layout; `EmptyState`/`loading-card`/`skeleton`/`spinner` standardize empty/loading; `MetricCard`/`AnalyticsMetricCard` for admin stat tiles.
- **Data layer:** TanStack Query hooks in `libs/hooks/` paired with `libs/queries/`, using shared query keys so invalidation stays consistent; the "wrapper-hook" pattern (`useItemMutations`) bundles a server action with its cache invalidation.
- **Auth overlay flow:** `auth-dialog.tsx` provides context + auto-opener reading `?auth=`/`?redirect=`; server-free URL builders in `libs/auth/landing-auth-url.ts` are safe to import from middleware and route handlers.
