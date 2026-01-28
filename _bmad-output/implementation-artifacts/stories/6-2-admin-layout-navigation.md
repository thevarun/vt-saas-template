# Story 6.2: Admin Layout & Navigation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin user,
I want a dedicated admin interface,
so that I can easily navigate admin features.

## Acceptance Criteria

### AC1: Admin-Specific Layout
**Given** I am an admin accessing admin section
**When** I view any admin page
**Then** I see an admin-specific layout
**And** layout is distinct from regular user layout
**And** admin navigation is visible

### AC2: Sidebar Navigation
**Given** the admin navigation
**When** I view the sidebar/menu
**Then** I see links to: Dashboard, Users, Feedback, Settings
**And** current page is highlighted
**And** navigation is collapsible on mobile

### AC3: Admin Header
**Given** the admin header
**When** I view admin pages
**Then** I see "Admin" indicator clearly
**And** I can navigate back to main app
**And** my user avatar/menu is accessible

### AC4: Smooth Navigation
**Given** admin pages
**When** I navigate between them
**Then** transitions are smooth
**And** active state updates correctly
**And** breadcrumbs show current location (optional)

### AC5: Mobile Responsiveness
**Given** the admin layout on mobile
**When** I view on small screens
**Then** navigation collapses to hamburger menu
**And** content is properly responsive
**And** all features remain accessible

### AC6: Route Structure
**Given** the admin route structure
**When** I review the code
**Then** admin routes are under `src/app/[locale]/(admin)/`
**And** layout is defined at route group level
**And** layout is self-contained (modular)

## Tasks / Subtasks

- [ ] Task 1: Install required shadcn components (AC: #1, #2, #5)
  - [ ] Subtask 1.1: Run `npx shadcn@latest add button card badge sheet separator`
  - [ ] Subtask 1.2: Verify components installed in `src/components/ui/`
  - [ ] Subtask 1.3: Check no TypeScript errors after installation

- [ ] Task 2: Create AdminSidebar component (AC: #2)
  - [ ] Subtask 2.1: Create `src/components/admin/AdminSidebar.tsx`
  - [ ] Subtask 2.2: Define nav items config with: Dashboard, Users, Feedback, Settings
  - [ ] Subtask 2.3: Add Lucide icons: LayoutDashboard, Users, MessageSquareText, Settings
  - [ ] Subtask 2.4: Implement active page highlighting using Next.js `usePathname()`
  - [ ] Subtask 2.5: Add collapsed/expanded states (240px full, 64px icons-only)
  - [ ] Subtask 2.6: Group nav items (Overview, Management, System)
  - [ ] Subtask 2.7: Add Separator components between groups
  - [ ] Subtask 2.8: Style with dark background (`bg-slate-800` light mode, `bg-black` dark mode)

- [ ] Task 3: Create AdminHeader component (AC: #3)
  - [ ] Subtask 3.1: Create `src/components/admin/AdminHeader.tsx`
  - [ ] Subtask 3.2: Add sidebar toggle button (hamburger icon)
  - [ ] Subtask 3.3: Add "Admin Panel" text with badge indicator
  - [ ] Subtask 3.4: Add "Back to App" link to main dashboard
  - [ ] Subtask 3.5: Add theme toggle (sun/moon icon)
  - [ ] Subtask 3.6: Add user avatar with dropdown menu
  - [ ] Subtask 3.7: Use flexbox layout with space-between alignment

- [ ] Task 4: Create AdminLayout wrapper (AC: #1, #5, #6)
  - [ ] Subtask 4.1: Create route group directory `src/app/[locale]/(admin)/`
  - [ ] Subtask 4.2: Create layout file `src/app/[locale]/(admin)/layout.tsx`
  - [ ] Subtask 4.3: Wrap children with AdminSidebar (desktop, hidden on mobile)
  - [ ] Subtask 4.4: Add Sheet component for mobile sidebar overlay
  - [ ] Subtask 4.5: Include AdminHeader at top of main content area
  - [ ] Subtask 4.6: Add main content wrapper with padding and overflow-auto
  - [ ] Subtask 4.7: Implement sidebar collapsed state management with useState
  - [ ] Subtask 4.8: Make layout responsive (breakpoints: md: 768px, lg: 1024px)

- [ ] Task 5: Create admin dashboard placeholder (AC: #1, #4)
  - [ ] Subtask 5.1: Create `src/app/[locale]/(admin)/admin/page.tsx`
  - [ ] Subtask 5.2: Add page title "Admin Dashboard"
  - [ ] Subtask 5.3: Add placeholder cards for future metrics (Story 6.5)
  - [ ] Subtask 5.4: Verify layout renders correctly around dashboard content
  - [ ] Subtask 5.5: Test navigation transitions between dashboard and other pages

- [ ] Task 6: Add admin route protection verification (AC: #6)
  - [ ] Subtask 6.1: Verify `/admin` routes protected by middleware from Story 6.1
  - [ ] Subtask 6.2: Test non-admin user redirect to dashboard with access denied
  - [ ] Subtask 6.3: Test admin user can access all admin pages
  - [ ] Subtask 6.4: Verify `isAdmin()` utility integration works correctly

- [ ] Task 7: Add i18n translations (AC: #3)
  - [ ] Subtask 7.1: Add admin navigation labels to `src/locales/en.json`
  - [ ] Subtask 7.2: Add "Admin Panel" and "Back to App" translations
  - [ ] Subtask 7.3: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 7.4: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 7.5: Use `useTranslations('Admin')` hook in components

- [ ] Task 8: Write component tests (AC: #2, #4, #5)
  - [ ] Subtask 8.1: Create `src/components/admin/AdminSidebar.test.tsx`
  - [ ] Subtask 8.2: Test active nav item highlighting
  - [ ] Subtask 8.3: Test collapsed/expanded state transitions
  - [ ] Subtask 8.4: Create `src/components/admin/AdminLayout.test.tsx`
  - [ ] Subtask 8.5: Test mobile Sheet overlay opens/closes
  - [ ] Subtask 8.6: Test responsive breakpoints (use window.matchMedia mock)

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The admin layout UI is already designed in SuperDesign prototypes with complete HTML/CSS implementation.

| Screen/Component | Design Tool | Location | Files to Adapt |
|------------------|-------------|----------|----------------|
| Admin Layout Shell | SuperDesign | `.superdesign/design_iterations/admin_layout_1.html` | Full layout structure |
| Sidebar Navigation | SuperDesign | `.superdesign/design_iterations/admin_layout_1.html` | Sidebar HTML/CSS |
| Admin Header | SuperDesign | `.superdesign/design_iterations/admin_layout_1.html` | Header HTML/CSS |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`
- Layouts Guide: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-layouts.md`

**Adaptation Checklist:**
- [ ] Extract HTML structure from `.superdesign/design_iterations/admin_layout_1.html`
- [ ] Convert inline styles and CSS classes to Tailwind utility classes
- [ ] Replace custom components with shadcn equivalents:
  - Custom sidebar → AdminSidebar with shadcn Sheet for mobile
  - Custom header → AdminHeader with shadcn Button, Avatar
  - Custom nav items → Next.js Link with active state detection
- [ ] Add `"use client"` directive where needed (components with hooks)
- [ ] Integrate with Next.js 15 route groups: `(admin)` directory structure
- [ ] Wire up i18n translations using `useTranslations('Admin')` hook
- [ ] Integrate with existing theme system (next-themes provider)
- [ ] Add proper TypeScript types for all props and state
- [ ] Ensure responsive behavior matches design layouts (desktop/tablet/mobile)
- [ ] Test dark mode appearance (dark sidebar becomes pure black)
- [ ] Verify sidebar collapse animation (200ms transition duration)

**shadcn Components to Use:**
```bash
npx shadcn@latest add button card badge sheet separator
```

**Key Design Tokens:**
- Sidebar width: 240px (expanded), 64px (collapsed)
- Sidebar background: `bg-slate-800` (light), `bg-black` (dark)
- Content padding: 24px (desktop), 16px (mobile)
- Border radius: 8px (cards), 6px (buttons)
- Transition duration: 200ms for all animations
- Breakpoints: md (768px), lg (1024px)

### Critical Architecture Requirements

**Next.js 15 Route Groups (MUST FOLLOW):**
- Admin routes MUST be in `src/app/[locale]/(admin)/` directory
- Route groups use parentheses: `(admin)` is NOT part of URL path
- Layout file at `src/app/[locale]/(admin)/layout.tsx` wraps all admin pages
- Each admin page at `src/app/[locale]/(admin)/admin/page.tsx` (dashboard), etc.
- Route structure: `/en/admin` maps to `src/app/[locale]/(admin)/admin/page.tsx`

**Layout Pattern (from Project):**
- Layouts receive `children` and `params` props
- Params must be awaited in Next.js 15: `const { locale } = await props.params`
- Client components for interactivity need `"use client"` directive
- Server components by default (no directive needed)
- Use `usePathname()` for active nav detection (client-side only)

**Admin Protection Integration:**
- Story 6.1 added `/admin` to middleware protection
- Middleware calls `isAdmin(user)` utility before allowing access
- Non-admin users redirected to `/dashboard?error=access_denied`
- Layout can assume user IS admin (middleware handles rejection)
- Still good practice to show admin indicator in UI

**Component Architecture (from UX Design):**
- AdminLayout: Server Component wrapper (layout.tsx)
- AdminSidebar: Client Component (needs usePathname, useState)
- AdminHeader: Client Component (needs useState for mobile menu)
- Nav items config: Plain object/array (no component)

**Styling Pattern:**
- Use Tailwind utility classes exclusively
- Follow shadcn/ui design system patterns
- Dark mode via `dark:` prefix (next-themes provider exists)
- Responsive via `md:`, `lg:` prefixes
- Animations via Tailwind `transition-*` utilities

**i18n Integration (CRITICAL):**
- All text MUST be translated via next-intl
- Pattern: `const t = useTranslations('Admin')`
- Translation keys in `src/locales/{locale}.json`
- Existing locales: English (en), Hindi (hi), Bengali (bn)
- Add new keys under `Admin` namespace

### Implementation Strategy

**Phase 1: Setup Route Structure**

1. Create route group directory:
   ```
   src/app/[locale]/(admin)/
     layout.tsx        # AdminLayout wrapper
     admin/
       page.tsx        # Dashboard (placeholder)
   ```

2. Verify middleware protection from Story 6.1:
   - Check `src/middleware.ts` has `/admin` in protectedPaths
   - Verify `isAdmin()` utility exists at `src/libs/auth/isAdmin.ts`

**Phase 2: Build Core Components**

**AdminSidebar Component:**
```typescript
// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, Users, MessageSquareText, Settings } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/libs/Helpers'

interface AdminSidebarProps {
  collapsed?: boolean
  mobile?: boolean
  onLinkClick?: () => void // Close Sheet on mobile
}

export function AdminSidebar({ collapsed, mobile, onLinkClick }: AdminSidebarProps) {
  const t = useTranslations('Admin')
  const pathname = usePathname()

  const navGroups = [
    {
      group: t('nav.overview'),
      items: [
        { label: t('nav.dashboard'), href: '/admin', icon: LayoutDashboard }
      ]
    },
    {
      group: t('nav.management'),
      items: [
        { label: t('nav.users'), href: '/admin/users', icon: Users },
        { label: t('nav.feedback'), href: '/admin/feedback', icon: MessageSquareText }
      ]
    },
    {
      group: t('nav.system'),
      items: [
        { label: t('nav.settings'), href: '/admin/settings', icon: Settings }
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname.endsWith('/admin')
    return pathname.includes(href)
  }

  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-slate-800 dark:bg-black",
      !mobile && collapsed ? "w-16" : "w-60",
      "transition-all duration-200"
    )}>
      {/* Logo/Brand area */}
      <div className="p-4">
        {!collapsed && <div className="text-white font-semibold">{t('brand')}</div>}
        {collapsed && <div className="text-white text-center">A</div>}
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={group.group} className="py-2">
            {idx > 0 && <Separator className="my-2 bg-slate-700" />}

            {!collapsed && (
              <div className="px-4 text-xs text-slate-400 uppercase mb-2">
                {group.group}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm",
                    "transition-colors duration-150",
                    active
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
```

**AdminHeader Component:**
```typescript
// src/components/admin/AdminHeader.tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const t = useTranslations('Admin')

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      {/* Left side: Menu + Title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t('title')}</h1>
          <Badge variant="default">{t('badge')}</Badge>
        </div>
      </div>

      {/* Right side: Back to App + Theme + Avatar */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4 mr-2" />
            {t('backToApp')}
          </Button>
        </Link>

        {/* Theme toggle would go here (existing in app) */}

        <Avatar className="h-8 w-8">
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
```

**AdminLayout (Next.js Layout):**
```typescript
// src/app/[locale]/(admin)/layout.tsx
'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onLinkClick={() => {}}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AdminSidebar
            mobile
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Phase 3: Add Translations**

Add to `src/locales/en.json`:
```json
{
  "Admin": {
    "brand": "Admin",
    "title": "Admin Panel",
    "badge": "Admin",
    "backToApp": "Back to App",
    "nav": {
      "overview": "Overview",
      "dashboard": "Dashboard",
      "management": "Management",
      "users": "Users",
      "feedback": "Feedback",
      "system": "System",
      "settings": "Settings"
    }
  }
}
```

Duplicate for `hi.json` and `bn.json` with appropriate translations.

**Phase 4: Create Dashboard Placeholder**

```typescript
// src/app/[locale]/(admin)/admin/page.tsx
import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function AdminDashboardPage() {
  const t = useTranslations('Admin')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder metric cards for Story 6.5 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Users</CardTitle>
            <CardDescription className="text-2xl font-bold">--</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Signups (7d)</CardTitle>
            <CardDescription className="text-2xl font-bold">--</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Users (7d)</CardTitle>
            <CardDescription className="text-2xl font-bold">--</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Feedback</CardTitle>
            <CardDescription className="text-2xl font-bold">--</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
```

### Testing Strategy

**Component Unit Tests:**

```typescript
// src/components/admin/AdminSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminSidebar } from './AdminSidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/users'
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

describe('AdminSidebar', () => {
  it('renders all nav groups', () => {
    render(<AdminSidebar />)

    expect(screen.getByText('nav.dashboard')).toBeInTheDocument()
    expect(screen.getByText('nav.users')).toBeInTheDocument()
    expect(screen.getByText('nav.feedback')).toBeInTheDocument()
    expect(screen.getByText('nav.settings')).toBeInTheDocument()
  })

  it('highlights active nav item', () => {
    render(<AdminSidebar />)

    const usersLink = screen.getByText('nav.users').closest('a')
    expect(usersLink).toHaveClass('bg-slate-700', 'text-white')
  })

  it('collapses to icon-only mode', () => {
    const { container } = render(<AdminSidebar collapsed />)

    // Check width class
    expect(container.firstChild).toHaveClass('w-16')
  })

  it('calls onLinkClick when nav item clicked', async () => {
    const onLinkClick = vi.fn()
    render(<AdminSidebar onLinkClick={onLinkClick} />)

    const dashboardLink = screen.getByText('nav.dashboard')
    await dashboardLink.click()

    expect(onLinkClick).toHaveBeenCalled()
  })
})
```

**E2E Test Considerations:**
- Test will be added in later stories when admin pages have actual content
- For now, verify that layout renders and navigation links exist
- Test protection: non-admin should not see admin pages (covered by Story 6.1)

### Project Structure Notes

**New Directories:**
```
src/
  app/[locale]/(admin)/          # Route group for admin
    layout.tsx                    # AdminLayout wrapper
    admin/
      page.tsx                    # Dashboard page
  components/admin/              # Admin-specific components
    AdminSidebar.tsx
    AdminHeader.tsx
```

**Import Pattern:**
```typescript
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
```

**Dependencies:**
- shadcn components: button, card, badge, sheet, separator, avatar
- Lucide icons: lucide-react (already installed)
- next-intl: useTranslations hook (already installed)
- next/navigation: usePathname for active detection

### Previous Story Intelligence

**Learnings from Story 6.1:**

1. **Middleware Integration:**
   - Story 6.1 added `/admin` route protection to `src/middleware.ts`
   - Created `isAdmin(user)` utility at `src/libs/auth/isAdmin.ts`
   - Non-admin users redirected to `/dashboard?error=access_denied`
   - Layout can assume user IS admin (no need to re-check)

2. **Component Patterns:**
   - Created `AccessDeniedToast.tsx` following existing toast pattern
   - Used "use client" directive for components with hooks
   - Followed Supabase client type separation (server/client/middleware)

3. **Translation Pattern:**
   - Added translations to all 3 locale files (en, hi, bn)
   - Used nested structure: `Errors.admin.accessDenied`
   - Pattern works well, continue for admin nav translations

4. **Testing Approach:**
   - Wrote 20 unit tests first (TDD RED-GREEN-REFACTOR)
   - Used Vitest with `vi.stubEnv()` for environment variables
   - Cast test objects through `unknown` to fix TypeScript errors
   - Achieved 326/326 tests passing

5. **File Organization:**
   - Created `src/libs/auth/` directory for auth utilities
   - Co-located tests: `isAdmin.test.ts` next to `isAdmin.ts`
   - Pattern should continue for admin components

### Git Intelligence Summary

**Recent Commit Analysis (b8ffa5c):**

Files changed in Story 6.1:
- Created: `src/libs/auth/isAdmin.ts` - Admin check utility
- Created: `src/libs/auth/isAdmin.test.ts` - 20 unit tests
- Created: `src/components/auth/AccessDeniedToast.tsx` - Toast component
- Modified: `src/middleware.ts` - Added admin route protection
- Modified: `src/app/[locale]/(auth)/dashboard/page.tsx` - Added toast
- Modified: `src/locales/*.json` - Added admin error translations
- Modified: `.env.example` - Added ADMIN_EMAILS variable

**Patterns to Follow:**
- TDD approach with unit tests first
- Co-locate tests with source files
- Use existing component patterns (toast, translations)
- Follow project's TypeScript strict mode
- Add translations for all locales immediately

**Code Conventions Observed:**
- No semicolons (Antfu ESLint config)
- Single quotes for strings
- Functional components with TypeScript interfaces
- Absolute imports with `@/` prefix
- Vitest for unit tests, Playwright for E2E

### Security Considerations

**Access Control:**
- Admin layout assumes middleware protection from Story 6.1
- All routes under `/admin/*` are protected by middleware
- `isAdmin(user)` utility checks both user_metadata.isAdmin and ADMIN_EMAILS
- Non-admin users never reach layout code (middleware redirects)

**Client-Side Safety:**
- AdminSidebar and AdminHeader are client components (need hooks)
- No sensitive data should be rendered in layout (only navigation)
- Future admin API calls (Stories 6.3+) MUST also verify admin status
- Remember: Middleware protects pages, API routes need explicit checks

**Environment Variables:**
- No admin-specific env vars needed for layout
- ADMIN_EMAILS from Story 6.1 is server-side only
- Any future admin config should follow same pattern

### References

- [Source: Epic 6 Story 6.2] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md] - Component mapping
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-layouts.md] - Responsive layouts
- [Source: .superdesign/design_iterations/admin_layout_1.html] - Complete prototype
- [Source: Story 6.1] - Admin access control implementation
- [Source: src/middleware.ts] - Admin route protection
- [Source: src/libs/auth/isAdmin.ts] - Admin check utility
- [Source: CLAUDE.md#Next.js 15 Route Groups] - Route structure patterns
- [Source: CLAUDE.md#i18n] - Translation patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** approved
**Date:** 2026-01-28 07:34
**Full Report:** [View Report](../../screenshots/story-6.2/desk-check-report.md)

Visual quality validated. Ready for code review.

### Verification Summary
- Admin layout renders correctly with dark sidebar
- Navigation groups (Overview, Management, System) with all items present
- Active state highlighting works on Dashboard
- Mobile responsiveness verified - hamburger menu opens Sheet overlay
- "Back to App" navigation functional
- All 6 acceptance criteria verified
