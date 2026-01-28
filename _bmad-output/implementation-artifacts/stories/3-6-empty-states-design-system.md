# Story 3.6: Empty States Design System

Status: ready-for-dev

## Story

As a **user viewing a section with no data**,
I want **to see helpful empty states instead of blank pages**,
So that **I understand what to do and don't feel confused**.

## Acceptance Criteria

**AC1: Empty State Component Structure**
- **Given** any list or data view with no items
- **When** the view loads
- **Then** I see an empty state component
- **And** it includes an illustration or icon
- **And** it includes a heading explaining the empty state
- **And** it includes a CTA to take action

**AC2: Reusable EmptyState Component**
- **Given** empty state components
- **When** I review the component library
- **Then** there is a reusable EmptyState component
- **And** it accepts props for: icon, title, description, action
- **And** it follows the design system styling

**AC3: Action Button Functionality**
- **Given** an empty state with a CTA
- **When** I click the action button
- **Then** I am taken to the relevant creation flow
- **And** the action is contextually appropriate

**AC4: Consistent Styling Across App**
- **Given** different empty states across the app
- **When** I compare them
- **Then** they have consistent styling
- **And** illustrations/icons follow a cohesive style
- **And** messaging tone is consistent (helpful, encouraging)

**AC5: Mobile Responsiveness**
- **Given** empty states
- **When** I view them on mobile
- **Then** they are properly sized and centered
- **And** CTAs are full-width and touch-friendly
- **And** text is readable

## Tasks / Subtasks

### Task 1: Extract & Adapt EmptyState Component from MagicPatterns (AC1, AC2, AC4)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa", fileNames: ["EmptyState.tsx"])
  ```
- [ ] **CREATE** ui component directory (if needed):
  - [ ] Ensure `src/components/ui/` directory exists
  - [ ] Extract `EmptyState.tsx` component code
- [ ] **ADAPT** extracted code for project:
  - [ ] Add `"use client"` directive (component uses event handlers)
  - [ ] Replace hardcoded text with i18n approach (accept title/description as props)
  - [ ] Use project's `Button` from `@/components/ui/button`
  - [ ] Import icons from `lucide-react` (Inbox, Search, AlertTriangle, etc.)
  - [ ] Ensure proper TypeScript types for all props
- [ ] **DEFINE** component interface:
  ```typescript
  interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    variant?: 'default' | 'search' | 'error';
  }
  ```

### Task 2: Implement Variant Support (AC1, AC2, AC4)
- [ ] **DEFAULT VARIANT**:
  - [ ] Inbox icon (64px, monochrome gray)
  - [ ] General empty state messaging
  - [ ] Neutral, helpful tone
- [ ] **SEARCH VARIANT**:
  - [ ] Search icon (64px, monochrome gray)
  - [ ] "No results found" messaging
  - [ ] Suggest refining search criteria
- [ ] **ERROR VARIANT**:
  - [ ] AlertTriangle icon (64px, orange/red)
  - [ ] Error messaging
  - [ ] "Retry" action button
- [ ] Style variants with conditional Tailwind classes
- [ ] Icons use consistent sizing and spacing

### Task 3: Style EmptyState Component (AC4, AC5)
- [ ] **LAYOUT**:
  - [ ] Center content vertically and horizontally
  - [ ] Use flexbox for alignment
  - [ ] Padding: `p-8` on desktop, `p-6` on mobile
  - [ ] Max-width constraint for text readability
- [ ] **ICON STYLING**:
  - [ ] Size: 64px (w-16 h-16)
  - [ ] Color: muted (text-muted-foreground)
  - [ ] Margin bottom: mb-4
- [ ] **TEXT STYLING**:
  - [ ] Title: `text-xl md:text-2xl font-semibold`
  - [ ] Description: `text-sm md:text-base text-muted-foreground`
  - [ ] Spacing between elements: `space-y-3`
- [ ] **BUTTON STYLING**:
  - [ ] Full-width on mobile: `w-full md:w-auto`
  - [ ] Primary variant by default
  - [ ] Min touch target: 44px height
  - [ ] Margin top: mt-6
- [ ] **DARK MODE SUPPORT**:
  - [ ] Icon colors adjust with `dark:` variants
  - [ ] Text colors adjust with `dark:` variants
  - [ ] Background transparent (inherits from parent)

### Task 4: Create Icon Constants (AC4)
- [ ] Import icons from `lucide-react`:
  ```typescript
  import {
    Inbox,        // Default empty state
    Search,       // Search no results
    AlertTriangle // Error state
  } from 'lucide-react'
  ```
- [ ] Define default icons per variant
- [ ] Allow icon override via props

### Task 5: Wire Up Action Handlers (AC3)
- [ ] Accept optional `action` prop with label and onClick
- [ ] Render Button only if action provided
- [ ] onClick handler calls provided function
- [ ] Use `useRouter` from next/navigation if needed for navigation
- [ ] Pass through any additional button props

### Task 6: Add Usage Examples to Component File (AC2)
- [ ] Add JSDoc with usage examples:
  ```typescript
  /**
   * EmptyState Component - Reusable empty state for lists and data views
   *
   * @example Default empty state
   * <EmptyState
   *   title="No items yet"
   *   description="Get started by creating your first item"
   *   action={{ label: "Create Item", onClick: () => router.push('/create') }}
   * />
   *
   * @example Search no results
   * <EmptyState
   *   variant="search"
   *   title="No results found"
   *   description="Try adjusting your search criteria"
   * />
   *
   * @example Error state
   * <EmptyState
   *   variant="error"
   *   title="Failed to load data"
   *   description="Something went wrong. Please try again."
   *   action={{ label: "Retry", onClick: handleRetry }}
   * />
   */
  ```

### Task 7: Create Demonstration Page (Optional but Recommended) (AC2, AC4)
- [ ] Create `src/app/[locale]/(auth)/dashboard/design-system/page.tsx`
- [ ] Showcase all EmptyState variants:
  - [ ] Default variant with action
  - [ ] Default variant without action
  - [ ] Search variant
  - [ ] Error variant with retry
  - [ ] Custom icon example
- [ ] Helpful for designers/developers to see all variants
- [ ] Can be removed before production or kept for reference

### Task 8: Add i18n Support (AC4)
- [ ] Component accepts title/description as props (already i18n-ready)
- [ ] Add example translation keys to `src/locales/en.json`:
  ```json
  "EmptyState": {
    "noItemsTitle": "No items yet",
    "noItemsDescription": "Get started by creating your first item",
    "noResultsTitle": "No results found",
    "noResultsDescription": "Try adjusting your search criteria",
    "errorTitle": "Failed to load data",
    "errorDescription": "Something went wrong. Please try again.",
    "actionCreate": "Create Item",
    "actionRetry": "Retry"
  }
  ```
- [ ] Add same keys to `hi.json` with Hindi translations
- [ ] Add same keys to `bn.json` with Bengali translations
- [ ] Document translation pattern in component JSDoc

### Task 9: Mobile Optimization (AC5)
- [ ] Test on mobile viewports (375px, 390px, 428px):
  - [ ] Icon properly sized (not too large)
  - [ ] Title responsive (text-xl on mobile, text-2xl on desktop)
  - [ ] Description readable (text-sm on mobile, text-base on desktop)
  - [ ] Button full-width on mobile (w-full md:w-auto)
  - [ ] Touch-friendly spacing (min 44px height)
  - [ ] No horizontal scroll
- [ ] Use Tailwind responsive classes throughout
- [ ] Test in both portrait and landscape orientations

### Task 10: Write Unit Tests
- [ ] Create `src/components/ui/__tests__/EmptyState.test.tsx`
- [ ] Test default variant:
  - [ ] Renders icon, title, description
  - [ ] Renders action button when provided
  - [ ] No action button when action not provided
  - [ ] Calls onClick when button clicked
- [ ] Test search variant:
  - [ ] Renders search icon
  - [ ] Applies search variant styling
- [ ] Test error variant:
  - [ ] Renders error icon
  - [ ] Applies error variant styling (error colors)
- [ ] Test custom icon:
  - [ ] Renders custom icon when provided
  - [ ] Overrides default variant icon
- [ ] Test responsive behavior:
  - [ ] Button width responsive (w-full on mobile)
  - [ ] Text sizes responsive

### Task 11: Create Storybook Story (Optional)
- [ ] Create `src/components/ui/EmptyState.stories.tsx`
- [ ] Stories for each variant:
  - [ ] Default
  - [ ] Search
  - [ ] Error
  - [ ] Custom icon
  - [ ] Without action
  - [ ] With action
- [ ] Interactive controls for all props
- [ ] Useful for design system documentation

## Dev Notes

### Architecture Compliance

**Component Organization:**
- Location: `src/components/ui/EmptyState.tsx` (design system component)
- Test: `src/components/ui/__tests__/EmptyState.test.tsx`
- Storybook: `src/components/ui/EmptyState.stories.tsx` (optional)
- Demo page: `src/app/[locale]/(auth)/dashboard/design-system/page.tsx` (optional)

**Component Pattern (Client Component):**
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Inbox, Search, AlertTriangle } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'search' | 'error'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  // Determine default icon based on variant
  const defaultIcon = {
    default: <Inbox className="size-16 text-muted-foreground" />,
    search: <Search className="size-16 text-muted-foreground" />,
    error: <AlertTriangle className="size-16 text-destructive" />,
  }[variant]

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center md:p-8">
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="mb-2 text-xl font-semibold md:text-2xl">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="w-full md:w-auto"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

**Usage Example (in any component):**
```typescript
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function MyList({ items }) {
  const t = useTranslations('MyList')
  const router = useRouter()

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('noItemsTitle')}
        description={t('noItemsDescription')}
        action={{
          label: t('createAction'),
          onClick: () => router.push('/create')
        }}
      />
    )
  }

  return <div>{/* Render items */}</div>
}
```

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| EmptyState Component | MagicPatterns | https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa | `EmptyState.tsx` |

**Extraction Command:**
```
mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa", fileNames: ["EmptyState.tsx"])
```

**Adaptation Checklist:**
- [ ] Add `"use client"` directive for Next.js
- [ ] Replace inline styles with project's Tailwind classes
- [ ] Use project's `Button` from `@/components/ui/button`
- [ ] Add proper TypeScript types for all props
- [ ] Import icons from `lucide-react`
- [ ] Ensure dark mode support with `dark:` variants
- [ ] Make fully responsive (mobile-first)
- [ ] Add JSDoc with usage examples
- [ ] Support variant prop ('default', 'search', 'error')

**Reference Documents:**
- Design Brief: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-design-brief.md](../../planning-artifacts/ux-design/epic-3-onboarding-design-brief.md)
- Component Strategy: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md](../../planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md)

### Library & Framework Requirements

**shadcn Components (Already Installed):**
- button (from Epic 2)
- No new shadcn components needed for EmptyState itself

**Icons (lucide-react):**
```typescript
import { Inbox, Search, AlertTriangle } from 'lucide-react'
```

**Optional Additional Icons:**
- Any icon from `lucide-react` can be used as custom icon
- Examples: Users (empty user list), FileText (empty documents), Package (empty products)

### File Structure Requirements

```
src/
├── components/ui/
│   ├── EmptyState.tsx                      # CREATE: Main empty state component
│   ├── EmptyState.stories.tsx              # CREATE (optional): Storybook stories
│   └── __tests__/
│       └── EmptyState.test.tsx             # CREATE: Unit tests
├── app/[locale]/(auth)/dashboard/
│   └── design-system/
│       └── page.tsx                        # CREATE (optional): Demo page
└── locales/
    ├── en.json                             # MODIFY: Add EmptyState translations
    ├── hi.json                             # MODIFY: Add EmptyState translations
    └── bn.json                             # MODIFY: Add EmptyState translations
```

### Testing Requirements

**Unit Tests (Vitest):**
- EmptyState renders correctly with all props
- Variant prop changes icon and styling
- Action button renders when action provided
- Action onClick handler called when clicked
- No action button when action not provided
- Custom icon overrides default variant icon
- Responsive classes applied correctly

**Integration Tests (Playwright):**
- Not required for this component (pure UI component)
- Integration testing happens when EmptyState is used in actual features

**Test File Location:**
- `src/components/ui/__tests__/EmptyState.test.tsx`

**Test Coverage:**
- Focus on component rendering with different props
- Variant behavior
- Action button interaction
- No need to test Tailwind classes (visual regression testing handles that)

### Previous Story Intelligence

**Story 3.5 Learnings - CRITICAL PATTERNS TO FOLLOW:**

1. **Component Structure Pattern:**
   ```typescript
   'use client'  // If uses hooks or event handlers

   import { Button } from '@/components/ui/button'
   import { IconName } from 'lucide-react'

   interface ComponentProps {
     // TypeScript interface
   }

   export function ComponentName(props: ComponentProps) {
     return (
       <div className="space-y-6">
         {/* Content */}
       </div>
     )
   }
   ```

2. **Card/Container Styling Pattern (from Onboarding):**
   ```jsx
   <div className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-xl dark:border-slate-800/50 dark:bg-slate-900">
   ```
   - Note: EmptyState doesn't use Card wrapper, but should match design system colors

3. **Button Pattern (from Onboarding/Dashboard):**
   ```jsx
   <Button
     className="w-full md:w-auto gap-2"
     onClick={handleAction}
   >
     {actionLabel}
   </Button>
   ```

4. **Responsive Text Pattern:**
   ```jsx
   <h3 className="text-xl md:text-2xl font-semibold">
   <p className="text-sm md:text-base text-muted-foreground">
   ```

5. **Icon Sizing Pattern:**
   ```jsx
   <Inbox className="size-16 text-muted-foreground" />
   ```

6. **Dark Mode Pattern:**
   - All colors must have `dark:` variants
   - Use semantic color classes (`text-muted-foreground`, `text-destructive`)
   - Don't hardcode colors (no `text-gray-500`)

### Git Intelligence Summary

**Recent Commits:**
- `41961b8`: refactor(dashboard): simplify layout and auto-create user preferences
- `c7f4e87`: fix(sidebar): resolve 9 code quality issues from code review
- `6ade2db`: feat(dashboard): apply MagicPatterns design to welcome dashboard and sidebar

**Key Patterns from Recent Work:**
- All UI components follow shadcn patterns (Button, Card, etc.)
- Comprehensive dark mode support mandatory
- Responsive design (mobile-first) with Tailwind classes
- Client components use `'use client'` directive
- All components properly typed with TypeScript interfaces
- Icon usage from `lucide-react` with consistent sizing

**Code Review Emphasis (from commit c7f4e87):**
- Code quality is actively checked and refined
- Expect thorough review of EmptyState implementation
- Follow all ESLint rules (no semicolons, single quotes in JSX)
- Ensure TypeScript strict mode compliance

### Latest Technical Specifics

**Next.js 15 Patterns:**
- Client Component pattern: `'use client'` directive at top
- Server Components by default (no directive)
- EmptyState is a Client Component (uses event handlers via action.onClick)

**Tailwind Responsive Design:**
```typescript
// Mobile-first approach
className="w-full md:w-auto"  // Full width on mobile, auto on desktop
className="text-sm md:text-base"  // Smaller on mobile, larger on desktop
className="p-6 md:p-8"  // Less padding on mobile, more on desktop
```

**Variant Pattern:**
```typescript
const variantStyles = {
  default: 'text-muted-foreground',
  search: 'text-muted-foreground',
  error: 'text-destructive',
}

<Icon className={`size-16 ${variantStyles[variant]}`} />
```

**Component Composition:**
```typescript
// Allow custom icon override
const displayIcon = icon || defaultIcon

// Conditional rendering
{description && <p>{description}</p>}
{action && <Button onClick={action.onClick}>{action.label}</Button>}
```

### Project Context Reference

**Critical Rules from CLAUDE.md:**

1. **Component Location:**
   - Design system components: `src/components/ui/`
   - EmptyState is a design system component (reusable across app)

2. **Import Pattern:**
   ```typescript
   // ✅ CORRECT
   import { Button } from '@/components/ui/button'
   import { EmptyState } from '@/components/ui/EmptyState'
   ```

3. **TypeScript Strict Mode:**
   - All props must have explicit types
   - No `any` types allowed
   - Optional props use `?` syntax
   - Use `React.ReactNode` for icon prop

4. **ESLint Rules (Antfu Config):**
   - No semicolons at end of statements
   - Single quotes in JSX attributes: `className='text-xl'`
   - No unused imports

5. **Dark Mode Support:**
   - All color classes need `dark:` variants
   - Use semantic colors: `text-muted-foreground`, `dark:text-muted-foreground`
   - Background inherits from parent

6. **Accessibility:**
   - Button must be keyboard accessible (automatic with Button component)
   - Min touch target: 44px height (Button component handles this)
   - Semantic HTML (h3 for title, p for description)

7. **i18n Pattern:**
   - Component accepts text as props (already i18n-ready)
   - Parent component handles translations using `useTranslations`
   - No hardcoded strings in EmptyState component

### Story Completion Status

**Ultimate Context Engine Analysis Completed**

This story file contains comprehensive developer guidance derived from:
- ✅ Epic 3 requirements and acceptance criteria (Story 3.6)
- ✅ Story 3.5 implementation patterns and learnings (dashboard components)
- ✅ UX design references (MagicPatterns URL for EmptyState Component)
- ✅ Component strategy document guidance (extract, don't rebuild)
- ✅ Design system patterns (shadcn components, Tailwind, dark mode)
- ✅ Git commit history for recent patterns (code quality, responsive design)
- ✅ Project context (CLAUDE.md, TypeScript strict mode, ESLint rules)
- ✅ Next.js 15 Client Component patterns
- ✅ Lucide React icon patterns
- ✅ Responsive design patterns (mobile-first Tailwind)

The developer now has everything needed for flawless implementation without guesswork or ambiguity.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - story prepared with comprehensive context.

### Completion Notes List

Story 3.6 creates a reusable EmptyState component for the design system. This component:
1. Provides consistent empty state UI across the app
2. Supports multiple variants (default, search, error)
3. Accepts custom icons, title, description, and action
4. Is fully responsive and mobile-optimized
5. Supports dark mode
6. Follows all project patterns (TypeScript strict, ESLint, Tailwind)

Key implementation notes:
- Extract base UI from MagicPatterns (EmptyState.tsx)
- Adapt for project patterns (shadcn Button, TypeScript, i18n-ready)
- Support 3 variants with appropriate icons and colors
- Mobile-first responsive design (w-full on mobile, w-auto on desktop)
- Client Component (uses onClick handlers)
- Location: `src/components/ui/` (design system component)
- No database changes required (pure UI component)

### File List

**To be Created:**
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/__tests__/EmptyState.test.tsx`
- `src/components/ui/EmptyState.stories.tsx` (optional)
- `src/app/[locale]/(auth)/dashboard/design-system/page.tsx` (optional demo)

**To be Modified:**
- `src/locales/en.json` (add EmptyState example translations)
- `src/locales/hi.json` (add EmptyState example translations)
- `src/locales/bn.json` (add EmptyState example translations)

**No Database Changes Required:**
- Pure UI component, no backend dependencies
