# Component Inventory

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan) | **Total:** 138 components | **Client:** ~70

---

## Summary

| Category | Count | Location |
|----------|-------|----------|
| UI Primitives | 37 | src/components/ui/ |
| Admin | 30 | src/components/admin/ |
| Chat | 16 | src/components/chat/ |
| Landing Features | 9 | src/features/landing/ |
| Onboarding | 8 | src/components/onboarding/ |
| Share/Social | 8 | src/components/share/ |
| Analytics | 7 | src/components/analytics/ |
| PSEO | 7 | src/components/pseo/ |
| Auth | 6 | src/components/auth/ |
| Layout | 6 | src/components/layout/ |
| Custom Hooks | 5 | src/hooks/ |
| Dashboard | 5 | src/components/dashboard/ |
| Errors | 3 | src/components/errors/ |
| Feedback | 3 | src/components/feedback/ |
| Other | 3 | src/components/ |
| Theme | 2 | src/components/theme/ |

---

## UI Primitives (shadcn/ui + Radix UI)

**Forms:** form, input, textarea, password-input, label, checkbox, switch, select, useFormField
**Layout:** card, separator, table, data-table (generic sortable/paginated)
**Overlays:** dialog, alert-dialog, sheet, popover, dropdown-menu, tooltip
**Interactive:** button, badge, tabs, accordion (+ variant files)
**Feedback:** toaster, toast, spinner, skeleton, progress, loading-card, EmptyState
**Viz:** chart (Recharts wrapper with ChartContext), avatar

---

## Layout Components

| Component | Purpose |
|-----------|---------|
| MainAppShell | Authenticated layout: collapsible sidebar, mobile Sheet, Cmd+B shortcut |
| NavItem | Navigation item with active state detection |
| LanguageSelector | i18n locale switcher (en/hi/bn) |
| UserProfileSection | Profile dropdown with sign-out |

---

## Chat Components

### Dify Implementation
ChatInterface (Assistant-UI runtime, SSE streaming, ErrorBoundary), Thread (composable primitives, auto-scroll), ThreadListSidebar (fetch/archive/loading), ThreadItem, ThreadView, ThreadTitleEditor, ThreadListSkeleton, EmptyThreadState, ErrorThreadState, TypingIndicator, AppShell (responsive layout), ChatOptionCard

### Vercel Implementation
VercelChatInterface (useChat hook), ConversationListSidebar, ConversationItem

---

## Admin Components

**Layout:** AdminLayoutClient (sidebar), AdminHeader, AdminSidebar
**Users:** UserTable (sortable/paginated), UserDetailDialog, DeleteUserDialog, SuspendUserDialog, ResetPasswordDialog
**Audit:** AuditLogTable, AuditLogFilters, AuditLogPagination
**Feedback:** FeedbackList, FeedbackCard, FeedbackDetailDialog, FeedbackFilters, FeedbackPagination
**Analytics:** AnalyticsDashboard, AnalyticsMetricCard, SignupsChart (Recharts), CompletionRatesCard, + skeleton variants
**Utils:** MetricCard, ExportCsvButton, EmailTestForm

---

## Other Components

**Errors:** ErrorBoundary (class, Sentry), ErrorFallback, types, index
**Auth:** social-auth-buttons (Google/GitHub), VerificationToast, AccessDeniedToast
**Onboarding:** OnboardingUsername (Zod+RHF), UsernameInput, OnboardingPreferences, OnboardingFeatureTour, ProgressIndicator
**Feedback:** FeedbackModal (type selection, analytics), FeedbackTrigger
**Share:** ShareLinkModal, ShareWidget, ShareLinksTable, platformIcons
**Analytics:** PostHogProvider, LandingPageTracker, SignupCompletedTracker, UserIdentifier
**PSEO:** PseoTemplate, Breadcrumbs (schema.org), RelatedPages
**Theme:** ThemeProvider (next-themes), ThemeToggle
**Dashboard:** WelcomeDashboard, ActionCard

---

## Custom Hooks

| Hook | Purpose |
|------|---------|
| useMenu | Toggle menu state |
| useUser | Supabase user + onAuthStateChange |
| useUsernameValidation | Debounced format + availability check |
| use-toast | Sonner toast wrapper |
| useFormField | RHF field context |

---

## State Management

- **React Context:** FormFieldContext, FormItemContext, ChartContext (all local scope)
- **localStorage:** sidebar_open, admin_sidebar_collapsed, dify_conversation_id
- **Custom Events:** `thread-created` (ChatInterface -> ThreadListSidebar)
- **Auth State:** Supabase client SDK with `onAuthStateChange`
